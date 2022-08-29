import dotenv from "dotenv";
import { MichelsonMap, TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
import { buf2hex } from "@taquito/utils";
import code from "../compiled/dao.json";
import metadata from "./metadata.json";

// Read environment variables from .env file
dotenv.config();

// Initialize RPC connection
const Tezos = new TezosToolkit(process.env.NODE_URL);

// Deploy to configured node with configured secret key
const deploy = async () => {
  try {
    const signer = await InMemorySigner.fromSecretKey(process.env.SECRET_KEY);

    Tezos.setProvider({ signer });

    // create a JavaScript object to be used as initial storage
    // https://tezostaquito.io/docs/originate/#a-initializing-storage-using-a-plain-old-javascript-object
    const storage = {
      metadata: MichelsonMap.fromLiteral({
        "": buf2hex(Buffer.from("tezos-storage:contents")),
        contents: buf2hex(Buffer.from(JSON.stringify(metadata))),
      }),
      // ^ contract metadata (tzip-16)
      // https://tzip.tezosagora.org/proposal/tzip-16/

      governanceToken: process.env.GOVERNANCE_TOKEN,

      vault: new MichelsonMap(),
      // ^ should be left empty,
      // unless you want to fill-in some values for test purpose

      config: {
        depositAmount: 4,
        refundThreshold: 32,
        quorumThreshold: 67,
        superMajority: 80,
        startDelay: 86400, // one day
        votingPeriod: 604800, // one week
        timelockDelay: 86400,
        timelockPeriod: 259200, // 3 days
        burnAddress: process.env.BURN_ADDRESS,
      },
      // ^ example configuration

      nextOutcomeId: 1,
      // ^ this should always be initialized with 1n

      outcomes: new MichelsonMap(),
      // ^ should be left empty,
      // unless you want to fill-in some values for test purpose
    };

    const op = await Tezos.contract.originate({ code, storage });
    await op.confirmation();
    console.log(`[OK] ${op.contractAddress}`);
  } catch (e) {
    console.log(e);
  }
};

deploy();
