import "./PageLoader.css";

type PageLoaderProps = {
  label?: string;
};

export const PageLoader = ({ label = "Загрузка..." }: PageLoaderProps) => (
  <div className="page-loader" role="status" aria-live="polite" aria-busy="true">
    <div className="page-loader__content">
      <div className="page-loader__spinner" aria-hidden="true" />
      <p className="page-loader__label">{label}</p>
    </div>
  </div>
);
