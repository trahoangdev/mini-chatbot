import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from '../components/MessageInput';

describe('MessageInput Component', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders textarea with placeholder', () => {
    render(<MessageInput onSend={mockOnSend} isLoading={false} disabled={false} />);
    expect(screen.getByPlaceholderText('Message AI...')).toBeInTheDocument();
  });

  it('updates message state on input', () => {
    render(<MessageInput onSend={mockOnSend} isLoading={false} disabled={false} />);
    const textarea = screen.getByPlaceholderText('Message AI...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    expect(textarea.value).toBe('Hello');
  });

  it('disables send button when message is empty', () => {
    render(<MessageInput onSend={mockOnSend} isLoading={false} disabled={false} />);
    const textarea = screen.getByPlaceholderText('Message AI...');
    fireEvent.change(textarea, { target: { value: '' } });
    const buttons = screen.getAllByRole('button');
    const sendButton = buttons.find(btn => btn.type === 'submit');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when message is not empty', () => {
    render(<MessageInput onSend={mockOnSend} isLoading={false} disabled={false} />);
    const textarea = screen.getByPlaceholderText('Message AI...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    const buttons = screen.getAllByRole('button');
    const sendButton = buttons.find(btn => btn.type === 'submit');
    expect(sendButton).not.toBeDisabled();
  });

  it('disables textarea when disabled prop is true', () => {
    render(<MessageInput onSend={mockOnSend} isLoading={false} disabled={true} />);
    expect(screen.getByPlaceholderText('Server not connected...')).toBeDisabled();
  });

  it('disables textarea when loading', () => {
    render(<MessageInput onSend={mockOnSend} isLoading={true} disabled={false} />);
    expect(screen.getByPlaceholderText('Message AI...')).toBeDisabled();
  });

  it('calls onSend with message on form submit', () => {
    render(<MessageInput onSend={mockOnSend} isLoading={false} disabled={false} />);
    const textarea = screen.getByPlaceholderText('Message AI...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(btn => btn.type === 'submit');
    fireEvent.click(submitButton);
    expect(mockOnSend).toHaveBeenCalledWith('Hello');
  });

  it('clears message after send', () => {
    render(<MessageInput onSend={mockOnSend} isLoading={false} disabled={false} />);
    const textarea = screen.getByPlaceholderText('Message AI...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(btn => btn.type === 'submit');
    fireEvent.click(submitButton);
    expect(textarea.value).toBe('');
  });

  it('does not send empty message', () => {
    render(<MessageInput onSend={mockOnSend} isLoading={false} disabled={false} />);
    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(btn => btn.type === 'submit');
    fireEvent.click(submitButton);
    expect(mockOnSend).not.toHaveBeenCalled();
  });
});
