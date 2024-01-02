-- CreateTable
CREATE TABLE "Book" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "bookIdentifier" TEXT NOT NULL,
    "identifierType" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Author" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AuthorBook" (
    "bookId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,

    PRIMARY KEY ("bookId", "authorId"),
    CONSTRAINT "AuthorBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuthorBook_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionBook" (
    "bookId" INTEGER NOT NULL,
    "collectionId" INTEGER NOT NULL,

    PRIMARY KEY ("bookId", "collectionId"),
    CONSTRAINT "CollectionBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CollectionBook_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "content" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_bookIdentifier_identifierType_key" ON "Book"("bookIdentifier", "identifierType");
