-- CreateTable
CREATE TABLE `defunts` (
    `id` VARCHAR(36) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `prenom` VARCHAR(100) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `date_naissance` DATETIME(3) NULL,
    `date_deces` DATETIME(3) NOT NULL,
    `photo_url` VARCHAR(500) NULL,
    `texte_annonce` TEXT NULL,
    `ceremonie_lieu` VARCHAR(255) NULL,
    `ceremonie_date` DATETIME(3) NULL,
    `ceremonie_heure` VARCHAR(10) NULL,
    `statut` ENUM('BROUILLON', 'PUBLIE', 'ARCHIVE') NOT NULL DEFAULT 'BROUILLON',
    `acces` ENUM('PUBLIC', 'PRIVE') NOT NULL DEFAULT 'PUBLIC',
    `token_famille` VARCHAR(255) NULL,
    `qr_code_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `defunts_slug_key`(`slug`),
    UNIQUE INDEX `defunts_token_famille_key`(`token_famille`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `condoleances` (
    `id` VARCHAR(36) NOT NULL,
    `defunt_id` VARCHAR(36) NOT NULL,
    `auteur_nom` VARCHAR(100) NOT NULL,
    `auteur_email` VARCHAR(255) NULL,
    `message` TEXT NOT NULL,
    `statut` ENUM('EN_ATTENTE', 'APPROUVE', 'REJETE') NOT NULL DEFAULT 'EN_ATTENTE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medias` (
    `id` VARCHAR(36) NOT NULL,
    `defunt_id` VARCHAR(36) NOT NULL,
    `type` ENUM('PHOTO', 'VIDEO') NOT NULL DEFAULT 'PHOTO',
    `url` VARCHAR(500) NOT NULL,
    `caption` VARCHAR(255) NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `videos_hommage` (
    `id` VARCHAR(36) NOT NULL,
    `defunt_id` VARCHAR(36) NOT NULL,
    `theme` VARCHAR(50) NOT NULL,
    `musique` VARCHAR(50) NOT NULL,
    `texte_overlay` TEXT NULL,
    `photo_ids` JSON NOT NULL,
    `statut` ENUM('EN_COURS', 'TERMINE', 'ERREUR') NOT NULL DEFAULT 'EN_COURS',
    `video_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `textes_hommage` (
    `id` VARCHAR(36) NOT NULL,
    `defunt_id` VARCHAR(36) NOT NULL,
    `contenu` TEXT NOT NULL,
    `tonalite` VARCHAR(50) NULL,
    `donnees` JSON NULL,
    `audio_url` VARCHAR(500) NULL,
    `pdf_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilisateurs` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('AGENCE', 'ADMIN') NOT NULL DEFAULT 'AGENCE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `utilisateurs_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `condoleances` ADD CONSTRAINT `condoleances_defunt_id_fkey` FOREIGN KEY (`defunt_id`) REFERENCES `defunts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medias` ADD CONSTRAINT `medias_defunt_id_fkey` FOREIGN KEY (`defunt_id`) REFERENCES `defunts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `videos_hommage` ADD CONSTRAINT `videos_hommage_defunt_id_fkey` FOREIGN KEY (`defunt_id`) REFERENCES `defunts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `textes_hommage` ADD CONSTRAINT `textes_hommage_defunt_id_fkey` FOREIGN KEY (`defunt_id`) REFERENCES `defunts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

