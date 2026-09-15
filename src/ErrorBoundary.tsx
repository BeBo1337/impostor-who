import { Component, type ErrorInfo, type ReactNode } from 'react';
import { he } from './copy/he';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/** Last line of defence: a Hebrew message and a reload button, never a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Only the error itself is logged; never any round data.
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeContent: 'center',
          gap: 12,
          padding: 24,
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>{he.errors.title}</h1>
        <p>{he.errors.body}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            minHeight: 48,
            padding: '0 24px',
            border: '3px solid var(--ink)',
            borderRadius: 14,
            background: 'var(--lime)',
            fontWeight: 700,
            fontSize: '1.05rem',
            justifySelf: 'center',
          }}
        >
          {he.errors.reload}
        </button>
      </div>
    );
  }
}
