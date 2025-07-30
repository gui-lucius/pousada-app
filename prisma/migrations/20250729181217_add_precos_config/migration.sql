-- CreateTable
CREATE TABLE "PrecosConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "hospedagem" JSONB NOT NULL,
    "categoriasExtras" JSONB NOT NULL,

    CONSTRAINT "PrecosConfig_pkey" PRIMARY KEY ("id")
);
