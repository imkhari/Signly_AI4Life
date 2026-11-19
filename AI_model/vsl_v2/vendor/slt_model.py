# ruff: noqa: N806, N812
# Vendored from VSL-GH 6c351e63; see LICENSE and MODEL-SOURCE.md.
"""
models/slt_model.py
-------------------
Skeleton-based Sign Language Translation Model.

Architecture:
  Input: Keypoint sequence (B, T, 411)
  -> Linear Projection (411 -> d_model)
  -> Positional Encoding
  -> Transformer Encoder (6L)
  -> CTC Head (gloss prediction, auxiliary loss)
  -> Transformer Decoder (6L) + Vietnamese generation
"""

import math

import torch
import torch.nn as nn
import torch.nn.functional as F


class PositionalEncoding(nn.Module):
    """Standard sinusoidal positional encoding."""

    def __init__(self, d_model: int, dropout: float = 0.1, max_len: int = 1000):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        pos = torch.arange(max_len).unsqueeze(1).float()
        div = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(pos * div)
        pe[:, 1::2] = torch.cos(pos * div)
        pe = pe.unsqueeze(0)  # (1, max_len, d_model)
        self.register_buffer("pe", pe)

    def forward(self, x):
        """x: (B, T, d_model)"""
        x = x + self.pe[:, : x.size(1)]
        return self.dropout(x)


class SLTModel(nn.Module):
    """
    End-to-end Sign Language Translation model.

    Inputs:
      src      : (B, T, input_dim)   keypoint sequence
      src_mask : (B, T)              True = padding
      tgt      : (B, L)              translation token IDs
      tgt_mask : (B, L)              True = padding

    Outputs (training):
      trans_logits : (B, L-1, trans_vocab_size)
      ctc_logits   : (T, B, gloss_vocab_size)   for CTC loss
    """

    def __init__(
        self,
        input_dim: int,
        gloss_vocab_size: int,
        trans_vocab_size: int,
        d_model: int = 512,
        nhead: int = 8,
        num_encoder_layers: int = 6,
        num_decoder_layers: int = 6,
        dim_feedforward: int = 2048,
        dropout: float = 0.1,
        pad_idx: int = 0,
    ):
        super().__init__()
        self.d_model = d_model
        self.pad_idx = pad_idx

        # -- Input projection --
        self.input_proj = nn.Sequential(
            nn.Linear(input_dim, d_model),
            nn.LayerNorm(d_model),
        )
        self.pos_enc = PositionalEncoding(d_model, dropout)

        # -- Transformer Encoder --
        enc_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True,
            norm_first=True,  # Pre-LN (stabler training)
        )
        self.encoder = nn.TransformerEncoder(
            enc_layer,
            num_layers=num_encoder_layers,
            norm=nn.LayerNorm(d_model),
        )

        # -- CTC Head (gloss auxiliary) --
        # gloss_vocab_size da bao gom <blank> (index 4 trong SPECIAL_TOKENS)
        self.ctc_head = nn.Linear(d_model, gloss_vocab_size)

        # -- Translation Decoder --
        self.tgt_embedding = nn.Embedding(trans_vocab_size, d_model, padding_idx=pad_idx)
        self.tgt_pos_enc = PositionalEncoding(d_model, dropout)

        dec_layer = nn.TransformerDecoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True,
            norm_first=True,
        )
        self.decoder = nn.TransformerDecoder(
            dec_layer,
            num_layers=num_decoder_layers,
            norm=nn.LayerNorm(d_model),
        )

        self.trans_head = nn.Linear(d_model, trans_vocab_size)

        # He so dieu chinh scale embedding
        self.emb_scale = math.sqrt(d_model)

        self._init_weights()

    def _init_weights(self):
        for p in self.parameters():
            if p.dim() > 1:
                nn.init.xavier_uniform_(p)

    def encode(self, src, src_key_padding_mask=None):
        """
        Encode keypoint sequence.
        src: (B, T, input_dim)
        Returns: memory (B, T, d_model)
        """
        x = self.input_proj(src)  # (B, T, d_model)
        x = self.pos_enc(x)
        memory = self.encoder(x, src_key_padding_mask=src_key_padding_mask)
        return memory

    def decode(self, tgt, memory, tgt_key_padding_mask=None, memory_key_padding_mask=None):
        """
        Decode translation tokens.
        tgt: (B, L) token IDs
        Returns: (B, L, d_model)
        """
        # Causal mask (auto-regressive)
        L = tgt.size(1)
        tgt_mask = nn.Transformer.generate_square_subsequent_mask(L, device=tgt.device)

        tgt_emb = self.tgt_embedding(tgt) * self.emb_scale  # (B, L, d_model)
        tgt_emb = self.tgt_pos_enc(tgt_emb)

        out = self.decoder(
            tgt_emb,
            memory,
            tgt_mask=tgt_mask,
            tgt_key_padding_mask=tgt_key_padding_mask,
            memory_key_padding_mask=memory_key_padding_mask,
        )
        return out

    def forward(self, src, src_mask, tgt, tgt_mask=None):
        """
        src:      (B, T, 411)
        src_mask: (B, T) True=pad
        tgt:      (B, L) translation IDs (bao gom BOS, khong co EOS)
        Returns:
          trans_logits: (B, L, vocab)
          ctc_log_probs: (T, B, gloss_vocab)
        """
        # Encode
        memory = self.encode(src, src_key_padding_mask=src_mask)  # (B, T, d)

        # CTC head
        ctc_logits = self.ctc_head(memory)  # (B, T, gloss_vocab)
        ctc_log_probs = F.log_softmax(ctc_logits, dim=-1)
        ctc_log_probs = ctc_log_probs.permute(1, 0, 2)  # (T, B, gloss_vocab)

        # Decode translation
        dec_out = self.decode(
            tgt, memory, tgt_key_padding_mask=tgt_mask, memory_key_padding_mask=src_mask
        )
        trans_logits = self.trans_head(dec_out)  # (B, L, vocab)

        return trans_logits, ctc_log_probs

    @torch.no_grad()
    def greedy_decode(self, src, src_mask, bos_idx, eos_idx, max_len=50):
        """Greedy decoding cho inference."""
        B = src.size(0)
        memory = self.encode(src, src_key_padding_mask=src_mask)

        ys = torch.full((B, 1), bos_idx, dtype=torch.long, device=src.device)
        finished = torch.zeros(B, dtype=torch.bool, device=src.device)

        for _ in range(max_len):
            dec_out = self.decode(ys, memory, memory_key_padding_mask=src_mask)
            next_logits = self.trans_head(dec_out[:, -1])  # (B, vocab)
            next_token = next_logits.argmax(-1)  # (B,)

            # Cac cau da finished -> tiep tuc output EOS (se bi cat khi decode)
            next_token = torch.where(finished, torch.full_like(next_token, eos_idx), next_token)

            ys = torch.cat([ys, next_token.unsqueeze(1)], dim=1)
            finished = finished | (next_token == eos_idx)
            if finished.all():
                break

        return ys[:, 1:]  # remove BOS
