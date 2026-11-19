"""Small temporal gloss recognizer; no sentence-generation decoder."""

import torch
from torch import nn


class TinyTemporalCTC(nn.Module):
    def __init__(self, classes: int, width: int = 128, layers: int = 2):
        super().__init__()
        self.projection = nn.Sequential(nn.Linear(822, width), nn.LayerNorm(width))
        self.encoder = nn.GRU(
            width,
            width // 2,
            num_layers=layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.1 if layers > 1 else 0.0,
        )
        self.classifier = nn.Linear(width, classes)

    def forward(self, frames: torch.Tensor, lengths: torch.Tensor) -> torch.Tensor:
        packed = nn.utils.rnn.pack_padded_sequence(
            self.projection(frames),
            lengths.cpu(),
            batch_first=True,
            enforce_sorted=False,
        )
        encoded, _ = self.encoder(packed)
        values, _ = nn.utils.rnn.pad_packed_sequence(encoded, batch_first=True)
        return self.classifier(values).log_softmax(dim=-1)


def decode(log_probs: torch.Tensor, lengths: torch.Tensor, tokens: list[str]) -> list[list[str]]:
    sequences = []
    for prediction, length in zip(log_probs.argmax(-1).tolist(), lengths.tolist(), strict=True):
        previous = -1
        sequence = []
        for index in prediction[:length]:
            if index != previous and index != 0:
                sequence.append(tokens[index])
            previous = index
        sequences.append(sequence)
    return sequences
