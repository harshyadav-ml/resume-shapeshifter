-- CreateTable
CREATE TABLE "TailoringRunRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "originalScore" INTEGER NOT NULL,
    "tailoredScore" INTEGER NOT NULL,
    "runJson" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ExportedDocumentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    CONSTRAINT "ExportedDocumentRecord_runId_fkey" FOREIGN KEY ("runId") REFERENCES "TailoringRunRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
