import {
  OnReferralCodeCreated,
  OnReferralCodeUpserted
} from '../../generated/ReferrerContract/PerpetualProtocolReferrer';
import { createReferralCode, getReferralCode, getReferrer } from './helper';

export function handleReferralCodeCreated(event: OnReferralCodeCreated) {
  // createdFor represents the referrer
  let referrer = getReferrer(event.params.createdFor);
  createReferralCode(
    event.params.referralCode,
    event.params.createdFor,
    event.params.timestamp
  );
  referrer.referralCode = event.params.referralCode;
  referrer.save();
}

export function handleReferralCodeUpserted(event: OnReferralCodeUpserted) {
  let existingReferralCode = getReferralCode(event.params.oldReferralCode);
  let newReferralCode = getReferralCode(event.params.newReferralCode);
  // Referee adds code
  if (event.params.action == 0) {
    existingReferralCode.referees.push(event.params.addr);
  } else if (event.params.action == 1) {
    // Referee updates the referral code
    // Remove referee from the old referral code list
    existingReferralCode.referees = existingReferralCode.referees.filter(
      addr => addr != event.params.addr
    );
    // Add referee to referral code that was updated to
    newReferralCode.referees.push(event.params.addr);
  } else if (event.params.action == 2) {
    // Referee removes the referral code
    existingReferralCode.referees = existingReferralCode.referees.filter(
      addr => addr != event.params.addr
    );
  }
}
