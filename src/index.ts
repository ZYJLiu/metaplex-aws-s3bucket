import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import {
  Metaplex,
  keypairIdentity,
  toMetaplexFile,
  toMetaplexFileFromJson,
} from "@metaplex-foundation/js"
import { awsStorage } from "@metaplex-foundation/js-plugin-aws"
import { S3Client } from "@aws-sdk/client-s3"
import * as fs from "fs"
import dotenv from "dotenv"
dotenv.config()

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)

  console.log("PublicKey:", user.publicKey.toBase58())

  const awsClient = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  })

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(awsStorage(awsClient, "metaplex-test-upload"))

  const buffer = fs.readFileSync("src/solana.jpg")
  const file = toMetaplexFile(buffer, "solana.jpg", {
    uniqueName: "TEST-IMAGE",
  })

  const imageUri = await metaplex.storage().upload(file)
  console.log("image uri:", imageUri)

  const data = {
    name: "TEST",
    image: imageUri,
  }

  const file2 = await toMetaplexFileFromJson(data, "", {
    uniqueName: "TEST-METADATA",
    contentType: "application/json",
  })

  const metadataUri = await metaplex.storage().upload(file2)
  console.log("metadata uri:", metadataUri)
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
