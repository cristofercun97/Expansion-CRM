export type SelectableReward = {
  id: string;
  amount: number;
};

export type SelectedRewardsResult = {
  selectedRewards: SelectableReward[];
  selectedAmount: number;
};

type RewardCandidate = {
  id: string;
  amount: number;
  amountCents: number;
};

function toAmountCents(amount: number): number {
  return Math.round(amount * 100);
}

export function selectRewardsForRequestedAmount(
  rewards: SelectableReward[],
  requestedAmount: number,
): SelectedRewardsResult | null {
  const targetCents = toAmountCents(requestedAmount);

  if (targetCents <= 0) {
    return null;
  }

  const candidates: RewardCandidate[] = rewards
    .filter((reward) => reward.amount > 0)
    .map((reward) => ({
      id: reward.id,
      amount: reward.amount,
      amountCents: toAmountCents(reward.amount),
    }))
    .sort((left, right) => right.amountCents - left.amountCents);

  function backtrack(
    index: number,
    remainingCents: number,
    picked: SelectableReward[],
  ): SelectableReward[] | null {
    if (remainingCents === 0) {
      return picked;
    }

    if (remainingCents < 0 || index >= candidates.length) {
      return null;
    }

    const current = candidates[index];

    const withCurrent = backtrack(index + 1, remainingCents - current.amountCents, [
      ...picked,
      {id: current.id, amount: current.amount},
    ]);

    if (withCurrent) {
      return withCurrent;
    }

    return backtrack(index + 1, remainingCents, picked);
  }

  const selectedRewards = backtrack(0, targetCents, []);

  if (!selectedRewards) {
    return null;
  }

  const selectedAmount =
    selectedRewards.reduce((sum, reward) => sum + reward.amount, 0);

  return {
    selectedRewards,
    selectedAmount,
  };
}
