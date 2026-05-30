CREATE TABLE "ArticleView" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ArticleView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArticleView_articleId_key" ON "ArticleView"("articleId");
CREATE INDEX "ArticleView_articleId_idx" ON "ArticleView"("articleId");
