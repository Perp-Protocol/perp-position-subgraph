import {
  OnReferralCodeCreated,
  OnReferralCodeUpserted
} from '../../generated/ReferrerContract/PerpetualProtocolReferrer';
import {
  createReferralCode,
  getReferralCode,
  getReferralCodeDayData,
  getTrader,
  removeAddressFromList
} from './helper';

export function handleReferralCodeCreated(event: OnReferralCodeCreated): void {
  let trader = getTrader(event.params.createdFor);

  // createdFor represents the referrer
  createReferralCode(
    event.params.referralCode,
    event.params.createdFor,
    event.params.timestamp
  );
  trader.referrerCode = event.params.referralCode;
  trader.save();
}

export function handleReferralCodeUpserted(
  event: OnReferralCodeUpserted
): void {
  let existingReferralCode = getReferralCode(event.params.oldReferralCode);
  let trader = getTrader(event.params.addr);
  // Only proceed any action, if the referee has a code attached
  if (existingReferralCode) {
    // Referee removes code
    let existingReferees = existingReferralCode.referees;
    if (event.params.action == 1) {
      existingReferralCode.referees = removeAddressFromList(
        existingReferees,
        event.params.addr.toHexString()
      );
      existingReferralCode.save();

      // trader no longer has a referee code
      trader.refereeCode = null;
      trader.save();
      return;
    }

    // add and update should only be possible if newReferralCode contains a value
    if (event.params.newReferralCode != '') {
      let newReferralCode = getReferralCode(event.params.newReferralCode);
      let newReferralCodeDayData = getReferralCodeDayData(
        event,
        newReferralCode.id
      );
      let newReferees = newReferralCode.referees;

      if (event.params.action == 0) {
        // if referee exists, do nothing
        if (existingReferees.includes(event.params.addr)) return;

        existingReferees.push(event.params.addr);
        existingReferralCode.referees = existingReferees;
        existingReferralCode.save();
      } else if (event.params.action == 2) {
        // Referee updates the referral code
        // Remove referee from the old referral code list
        existingReferralCode.referees = removeAddressFromList(
          existingReferees,
          event.params.addr.toHexString()
        );
        existingReferralCode.save();

        // Add referee to referral code that was updated to
        if (newReferees.includes(event.params.addr)) return;
        newReferees.push(event.params.addr);
        newReferralCode.referees = newReferees;
        newReferralCode.save();
      }

      // uptick new referee daydata when an update or new referee is added
      let newReferralReferees = newReferralCodeDayData.newReferees;
      newReferralReferees.push(event.params.addr);
      newReferralCodeDayData.newReferees = newReferralReferees;
      newReferralCodeDayData.save();

      // update the referee code for the trader (sender)
      trader.refereeCode = newReferralCode.id;
      trader.save();
    }
  }
}
