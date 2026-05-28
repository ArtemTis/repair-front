import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, Card } from "../../shared/ui";
import { useGetArticleByIdQuery, useGetArticlesQuery } from "../../shared/api/articlesApi";
import { RoutePath } from "../../shared/config/routerConfig";
import type { IArticle } from "../../shared/types";
import { EMPTY_ARRAY } from "../../shared/lib/emptyArray";
import "./ArticlesPage.css";

const formatDate = (value: string | null) => {
  if (!value) {
    return "Без даты";
  }

  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getArticleDate = (article: IArticle) =>
  article.published_at ?? article.created_at;

const ArticlesListView = () => {
  const navigate = useNavigate();
  const { data: articles = EMPTY_ARRAY, isLoading, isError, error } = useGetArticlesQuery();

  return (
    <section className="articles-page">
      <div className="articles-page__content">
        <header className="articles-page__hero">
          <p className="articles-page__eyebrow">База знаний</p>
          <h1 className="articles-page__title">Статьи по ремонту техники</h1>
          <p className="articles-page__subtitle">
            Короткие инструкции и советы, которые помогут безопасно разобраться
            с частыми неисправностями.
          </p>
        </header>

        {isLoading && <p className="articles-page__state">Загрузка статей…</p>}

        {isError && (
          <p className="articles-page__state articles-page__state--error" role="alert">
            {(error as { data?: { message?: string } })?.data?.message ??
              "Не удалось загрузить статьи. Попробуйте позже."}
          </p>
        )}

        {!isLoading && !isError && articles.length === 0 && (
          <p className="articles-page__state">Статей пока нет</p>
        )}

        {!isLoading && !isError && articles.length > 0 && (
          <div className="articles-page__feed">
            {articles.map((article) => (
              <Card className="articles-page__post" key={article.id}>
                <div className="articles-page__post-head">
                  <span className="articles-page__post-badge">Ремонт</span>
                  <time className="articles-page__post-date">
                    {formatDate(getArticleDate(article))}
                  </time>
                </div>

                <h2 className="articles-page__post-title">{article.title}</h2>

                <div className="articles-page__post-preview markdown-body markdown-body--preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {article.excerpt}
                  </ReactMarkdown>
                </div>

                <div className="articles-page__post-actions">
                  <Button
                    className="articles-page__read-button"
                    onClick={() => navigate(`${RoutePath.articles}/${article.id}`)}
                  >
                    Читать полностью
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const ArticleDetailView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const articleId = Number(id ?? 0);
  const {
    data: article,
    isLoading,
    isError,
    error,
  } = useGetArticleByIdQuery(articleId, { skip: !articleId });

  return (
    <section className="articles-page articles-page--detail">
      <Card className="articles-page__article-shell">
        <div className="articles-page__article-top">
          <Button
            className="articles-page__back-button"
            variant="ghost"
            onClick={() => navigate(RoutePath.articles)}
          >
            ← Назад
          </Button>
        </div>

        {isLoading && <p className="articles-page__state">Загрузка статьи…</p>}

        {(!articleId || isError) && (
          <p className="articles-page__state articles-page__state--error" role="alert">
            {(error as { data?: { message?: string } })?.data?.message ??
              "Статья не найдена."}
          </p>
        )}

        {article && (
          <article className="articles-page__article">
            <header className="articles-page__article-header">
              <p className="articles-page__eyebrow">Статья</p>
              <h1 className="articles-page__article-title">{article.title}</h1>
              <time className="articles-page__article-date">
                {formatDate(getArticleDate(article))}
              </time>
            </header>

            <div className="markdown-body articles-page__article-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content_markdown}
              </ReactMarkdown>
            </div>
          </article>
        )}
      </Card>
    </section>
  );
};

const ArticlesPage = () => (
  <Routes>
    <Route index element={<ArticlesListView />} />
    <Route path=":id" element={<ArticleDetailView />} />
  </Routes>
);

export default ArticlesPage;
