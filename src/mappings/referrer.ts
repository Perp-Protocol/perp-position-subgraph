import {
  OnReferralCodeCreated,
  OnReferralCodeUpserted
} from '../../generated/ReferrerContract/PerpetualProtocolReferrer';
import { createReferralCode, getReferralCode, getReferrer, removeAddressFromList } from './helper';
import { BigInt } from "@graphprotocol/graph-ts"
import { log } from '@graphprotocol/graph-ts';

export function handleReferralCodeCreated(event: OnReferralCodeCreated): void {
  let referrer = getReferrer(event.params.createdFor);

  // createdFor represents the referrer
  createReferralCode(
    event.params.referralCode,
    event.params.createdFor,
    event.params.timestamp
  );
  referrer.referralCode = event.params.referralCode;
  referrer.save();
}

export function handleReferralCodeUpserted(
  event: OnReferralCodeUpserted
): void {
  log.error('OLD REF CODE ID {}, NEW REF CODE ID {}, ACTION, {}', [event.params.oldReferralCode, event.params.newReferralCode, BigInt.fromI32(event.params.action).toString()]);
  let existingReferralCode = getReferralCode(event.params.oldReferralCode);
  // Only proceed any action, if the referee has a code attached
  if (existingReferralCode) {
    // Referee removes code
    let existingReferees = existingReferralCode.referees;
    if (event.params.action == 1) {
      existingReferralCode.referees = removeAddressFromList(existingReferees, event.params.addr.toHexString());
      existingReferralCode.save();
      return;
    }

    // add and update should only be possible if newReferralCode contains a value 
    if (event.params.newReferralCode != '') {
      let newReferralCode = getReferralCode(event.params.newReferralCode);
      let newReferees = newReferralCode.referees;

      if (event.params.action == 0) {
        // if referee exists, do nothing
        if (existingReferees.includes(event.params.addr)) return;

        existingReferees.push(event.params.addr);
        existingReferralCode.referees = existingReferees;
        existingReferralCode.save();
        return;
      }
      if (event.params.action == 2) {
        // Referee updates the referral code
        // Remove referee from the old referral code list
        existingReferralCode.referees = removeAddressFromList(existingReferees, event.params.addr.toHexString());
        existingReferralCode.save();

        // Add referee to referral code that was updated to
        if (newReferees.includes(event.params.addr)) return;
        newReferees.push(event.params.addr);
        newReferralCode.referees = newReferees;
        newReferralCode.save();
        return;
      }
    }
  }
}
