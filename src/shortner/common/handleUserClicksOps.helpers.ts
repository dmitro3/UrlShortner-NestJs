import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

@Injectable()
export class HandleUserClicksOps {
  private readonly noPageFound = null;
  private suiClient;
  private keyPair;
  constructor(
    @InjectModel('Affiliate')
    private readonly affiliateModel: Model<any>,
    @InjectModel('Campaign')
    private readonly campaignModel: Model<any>,
  ) {
    this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    this.keyPair = Ed25519Keypair.deriveKeypair(process.env.OWNER_MNEMONIC_KEY);
  }

  updateClickCount = ({ campaignInfoAddress, profileAddress }: any) => {
    return new Promise<void>((resolve) => {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [
          txb.object(process.env.CAMPAIGN_CONFIG),
          txb.object(campaignInfoAddress),
          txb.object(profileAddress),
        ],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::update_affiliate_via_campaign`,
      });
      const promiseResponse = this.suiClient.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: this.keyPair,
        requestType: 'WaitForLocalExecution',
        options: {
          showEffects: true,
        },
      });
      resolve(promiseResponse as any);
    });
  };

  endCampaign = (campaignInfoAddress: string) => {
    return new Promise<void>((resolve) => {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [txb.object(campaignInfoAddress)],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::end_campaign`,
      });
      const promiseResponse = this.suiClient.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: this.keyPair,
        requestType: 'WaitForLocalExecution',
        options: {
          showEffects: true,
        },
      });
      resolve(promiseResponse as any);
    });
  };

  updateClickExpire = async (campaignInfoAddress: string) => {
    try {
      await this.endCampaign(campaignInfoAddress);
      await this.affiliateModel.updateOne(
        { campaignInfoAddress },
        {
          $set: {
            originalUrl: `${process.env.BACKEND_URL}/404`,
          },
        },
      );
      await this.campaignModel.updateOne(
        { campaignInfoAddress },
        {
          $set: {
            status: 3,
          },
        },
      );
    } catch (e) {
      console.log('e=====>', e);
      return this.noPageFound;
    }
  };
}
