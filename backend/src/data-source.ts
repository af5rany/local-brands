// // Run this command to generate migration:
// // npx typeorm migration:generate src/migrations/UpdateProductSchema -d src/data-source.ts

// // Example migration file: src/migrations/1234567890123-UpdateProductSchema.ts
// import { MigrationInterface, QueryRunner } from 'typeorm';

// export class UpdateProductSchema1234567890123 implements MigrationInterface {
//   name = 'UpdateProductSchema1234567890123';

//   public async up(queryRunner: QueryRunner): Promise<void> {
//     // Create product_variant table
//     await queryRunner.query(`
//       CREATE TABLE "product_variant" (
//         "id" SERIAL NOT NULL,
//         "color" character varying NOT NULL,
//         "variantImages" text NOT NULL,
//         "stock" integer NOT NULL DEFAULT '0',
//         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
//         "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
//         "productId" integer,
//         CONSTRAINT "PK_43aa2b6a2d0b98bf0cb23cdb0be" PRIMARY KEY ("id")
//       )
//     `);

//     // Add new columns to product table
//     await queryRunner.query(`
//       ALTER TABLE "product"
//       ADD COLUMN "material" character varying,
//       ADD COLUMN "careInstructions" character varying,
//       ADD COLUMN "origin" character varying,
//       ADD COLUMN "weight" numeric(8,2),
//       ADD COLUMN "length" numeric(8,2),
//       ADD COLUMN "width" numeric(8,2),
//       ADD COLUMN "height" numeric(8,2),
//       ADD COLUMN "isFeatured" boolean NOT NULL DEFAULT false
//     `);

//     // Update gender enum values
//     await queryRunner.query(`
//       ALTER TABLE "product"
//       ALTER COLUMN "gender" TYPE character varying
//     `);

//     // Add foreign key constraint
//     await queryRunner.query(`
//       ALTER TABLE "product_variant"
//       ADD CONSTRAINT "FK_6e420052844edf3a5506d863ce6"
//       FOREIGN KEY ("productId")
//       REFERENCES "product"("id")
//       ON DELETE CASCADE
//     `);
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {
//     await queryRunner.query(
//       `ALTER TABLE "product_variant" DROP CONSTRAINT "FK_6e420052844edf3a5506d863ce6"`,
//     );
//     await queryRunner.query(`DROP TABLE "product_variant"`);
//     await queryRunner.query(`
//       ALTER TABLE "product"
//       DROP COLUMN "material",
//       DROP COLUMN "careInstructions",
//       DROP COLUMN "origin",
//       DROP COLUMN "weight",
//       DROP COLUMN "length",
//       DROP COLUMN "width",
//       DROP COLUMN "height",
//       DROP COLUMN "isFeatured"
//     `);
//   }
// }
