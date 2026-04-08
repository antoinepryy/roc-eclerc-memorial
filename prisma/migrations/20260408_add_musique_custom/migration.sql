-- CreateTable
CREATE TABLE `musiques_custom` (
    `id` VARCHAR(36) NOT NULL,
    `defunt_id` VARCHAR(36) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `source` VARCHAR(20) NOT NULL DEFAULT 'admin',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `musiques_custom` ADD CONSTRAINT `musiques_custom_defunt_id_fkey` FOREIGN KEY (`defunt_id`) REFERENCES `defunts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
