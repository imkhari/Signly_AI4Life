import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { Modal } from '../src/ui/Modal';

describe('Modal keyboard access', () => {
  it('keeps focus in the dialog, restores the opener and allows scrolling after close', () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Mở phiếu</button>
        <Modal isOpen={open} title="Kiểm tra phiếu" onClose={() => setOpen(false)}>
          <button>Hành động cuối</button>
        </Modal></>;
    }
    render(<Example />);
    const opener = screen.getByRole('button', { name: 'Mở phiếu' });
    opener.focus(); fireEvent.click(opener);
    const close = screen.getByRole('button', { name: 'Đóng hộp thoại' });
    const last = screen.getByRole('button', { name: 'Hành động cuối' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
});
