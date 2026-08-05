-- CreateTable
CREATE TABLE "Komunitas" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Komunitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Umkm" (
    "id" SERIAL NOT NULL,
    "namaOwner" TEXT NOT NULL,
    "namaUsaha" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "alamatUsaha" TEXT NOT NULL,
    "noHpWa" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "komunitasId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Umkm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" INTEGER,
    "description" TEXT NOT NULL,
    "longDescription" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "umkmId" INTEGER,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "lid" TEXT,
    "linkToken" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "items" JSONB NOT NULL,
    "total" INTEGER NOT NULL,
    "negotiatedPrice" INTEGER,
    "priceOffers" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "umkmId" INTEGER,
    "checkoutGroupId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "authToken" TEXT NOT NULL,
    "widgets" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IotData" (
    "id" SERIAL NOT NULL,
    "deviceName" TEXT NOT NULL,
    "projectId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "humidity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pins" JSONB NOT NULL DEFAULT '{}',
    "relays" JSONB NOT NULL DEFAULT '{}',
    "relay" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IotData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Komunitas_nama_key" ON "Komunitas"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Umkm_slug_key" ON "Umkm"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_lid_key" ON "User"("lid");

-- CreateIndex
CREATE UNIQUE INDEX "User_linkToken_key" ON "User"("linkToken");

-- CreateIndex
CREATE UNIQUE INDEX "Project_authToken_key" ON "Project"("authToken");

-- CreateIndex
CREATE UNIQUE INDEX "IotData_deviceName_key" ON "IotData"("deviceName");

-- AddForeignKey
ALTER TABLE "Umkm" ADD CONSTRAINT "Umkm_komunitasId_fkey" FOREIGN KEY ("komunitasId") REFERENCES "Komunitas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_umkmId_fkey" FOREIGN KEY ("umkmId") REFERENCES "Umkm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_umkmId_fkey" FOREIGN KEY ("umkmId") REFERENCES "Umkm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IotData" ADD CONSTRAINT "IotData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
