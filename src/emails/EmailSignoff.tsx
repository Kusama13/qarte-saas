import { Text } from '@react-email/components';
import * as React from 'react';

interface EmailSignoffProps {
  /** Optional intro line ("À très vite,", "Merci,", etc.). Rendered above the highlighted signature. */
  prefix?: React.ReactNode;
  /** The highlighted signature line (e.g. "L'équipe Qarte 💜"). */
  children: React.ReactNode;
  /** Italic the whole block. Used by SmsPack/SmsQuota informational emails. */
  italic?: boolean;
}

const baseStyle = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '32px 0 0 0',
};

const highlightStyle = {
  color: '#4b0082',
  fontWeight: '600',
};

export function EmailSignoff({ prefix, children, italic }: EmailSignoffProps) {
  const style = italic ? { ...baseStyle, fontStyle: 'italic' as const } : baseStyle;
  return (
    <Text style={style}>
      {prefix ? <>{prefix}<br /></> : null}
      <span style={highlightStyle}>{children}</span>
    </Text>
  );
}

export default EmailSignoff;
