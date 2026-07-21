interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="p-md bg-surface border-l-4 border-error text-error font-body-md text-body-md select-none"
      role="status"
      data-testid="error-banner"
    >
      {message}
    </div>
  );
}
