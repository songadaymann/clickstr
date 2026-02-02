# How Clickstr Works

A plain-English guide to understanding the game, even if you've never heard of blockchain, hashing, or smart contracts.

---

## Table of Contents

1. [The Big Picture](#the-big-picture)
2. [What Is a "Click"?](#what-is-a-click)
3. [Why Is It Called Proof-of-Work?](#why-is-it-called-proof-of-work)
4. [Epochs: The Game's Daily Rhythm](#epochs-the-games-daily-rhythm)
5. [How Rewards Work](#how-rewards-work)
6. [The 50/50 Burn: Why Half Disappears](#the-5050-burn-why-half-disappears)
7. [Difficulty: How the Game Stays Fair](#difficulty-how-the-game-stays-fair)
8. [Winning an Epoch](#winning-an-epoch)
9. [Finalizing Epochs](#finalizing-epochs)
10. [How the Game Ends](#how-the-game-ends)
11. [Putting It All Together](#putting-it-all-together)
12. [Glossary](#glossary)

---

## The Big Picture

Clickstr is a 90-day game where you click a button to earn $CLICK tokens. But here's the twist:

- **Every time you earn tokens, an equal amount is destroyed forever**
- **The more people click, the harder it gets to earn**
- **Each day has a winner who gets a bonus**

Think of it like a gold rush, but the gold mine shrinks every time someone finds gold, and half of every nugget you find crumbles to dust in your hands.

---

## What Is a "Click"?

When you click the button in Clickstr, you're not just sending a simple "I clicked!" message. Your computer is actually doing work behind the scenes.

### The Simple Explanation

Imagine you have a combination lock with a million possible combinations. A "click" is your computer trying random combinations until it finds one that works. When it finds a working combination, that's a valid click.

### What's Actually Happening

1. Your computer picks a random number (called a "nonce")
2. It combines that number with your wallet address, the current day, and some other info
3. It runs this through a mathematical blender called a "hash function"
4. If the result is below a certain threshold, congratulations - that's a valid click!
5. If not, try another random number...

Your computer does this thousands of times per second until it finds enough valid combinations. Then it bundles them up (minimum 50, maximum 500) and sends them to the game.

### Why Can't I Just Fake Clicks?

The math is designed so that:
- Only YOUR wallet can use the combinations your computer finds
- Each combination can only be used once
- The game can instantly verify if a combination is valid
- There's no shortcut - you have to do the work

---

## Why Is It Called Proof-of-Work?

The term comes from Bitcoin and other cryptocurrencies. The idea is simple: **your computer proves it did real computational work by finding these special numbers.**

It's like a teacher who wants proof you did your homework. Instead of trusting you, they give you a puzzle that takes time to solve. When you show the solution, they know you put in the effort.

In Clickstr:
- The "homework" is finding numbers that produce special hash results
- The "proof" is the list of numbers (nonces) you submit
- The "teacher" is the smart contract that verifies your work

This prevents cheating because there's no way to fake the work - you either did the computational effort or you didn't.

---

## Epochs: The Game's Daily Rhythm

An **epoch** is just a fancy word for "a period of time." In Clickstr, one epoch = one day (24 hours).

### The 90-Day Structure

```
Day 1  = Epoch 1
Day 2  = Epoch 2
Day 3  = Epoch 3
...
Day 90 = Epoch 90 (Final day!)
```

### Why Epochs Matter

Each epoch is like a mini-competition:

1. **Fresh Start**: Everyone's click count resets to zero
2. **Daily Prize Pool**: A portion of tokens becomes available
3. **Winner Takes Bonus**: Whoever clicks the most that day gets extra
4. **Difficulty Adjusts**: The game recalibrates based on participation

Think of it like a daily tournament. You compete during the day, winners are announced, and tomorrow is a new tournament.

---

## How Rewards Work

### The Token Pool

When the game starts, 100 million $CLICK tokens are locked in the game's vault. This is called the **pool**.

### Daily Emission

Each day (epoch), 2% of the remaining pool becomes available as rewards. Here's how that plays out:

| Day | Pool at Start | Available (2%) |
|-----|---------------|----------------|
| 1   | 100,000,000   | 2,000,000      |
| 2   | ~98,000,000   | ~1,960,000     |
| 3   | ~96,040,000   | ~1,920,800     |
| ... | ...           | ...            |
| 90  | Much less     | Much less      |

Notice how the daily rewards shrink over time? This creates urgency - early players have access to bigger reward pools.

### How Your Clicks Become Tokens

When you submit your valid clicks:

1. The game looks at how many valid clicks you submitted
2. It calculates your share of the day's emission
3. You receive tokens based on your proportion of the target (1 million clicks per day)

**Example**: If the day's budget is 2,000,000 tokens and you submit 100 valid clicks:
```
Your reward = 2,000,000 * (100 / 1,000,000) = 200 tokens
```

But wait - you don't get all 200. Read on...

---

## The 50/50 Burn: Why Half Disappears

Here's what makes Clickstr "stupid" (in a clever way):

**Every token that would be given out is split 50/50:**
- Half goes to you
- Half is sent to a "burn address" and destroyed forever

### What's a Burn Address?

A burn address is a wallet that nobody owns or can ever access. Tokens sent there are effectively deleted from existence. The address used is:

```
0x000000000000000000000000000000000000dEaD
```

(Yes, it literally spells "dead" at the end.)

### Why Burn Tokens?

This creates **deflation** - the total supply of $CLICK tokens constantly shrinks. If you're holding $CLICK tokens:

- Every click by every player reduces the total supply
- Fewer tokens in existence = each remaining token is more scarce
- Scarcity can increase value

It's like if every time someone mined gold, half of all gold in the world disappeared. The remaining gold becomes more valuable.

### The Real Math

If you'd earn 200 tokens:
- You receive: 100 tokens
- Burned forever: 100 tokens

The game is literally destroying value with every click. Stupid? Maybe. Interesting tokenomics? Definitely.

---

## Difficulty: How the Game Stays Fair

### The Problem

If clicking is too easy, everyone floods in, tokens get distributed too fast, and the game ends quickly with no excitement.

If clicking is too hard, nobody can earn anything, and the game is frustrating.

### The Solution: Automatic Difficulty Adjustment

The game has a target: **1 million clicks per day** across all players.

At the end of each epoch, the game looks at how many total clicks happened:

| Scenario | What Happens |
|----------|--------------|
| Way more than 1M clicks | Game gets harder (up to 4x) |
| Slightly more than 1M | Game gets a bit harder |
| Exactly 1M clicks | No change |
| Slightly less than 1M | Game gets a bit easier |
| Way less than 1M clicks | Game gets easier (up to 4x) |

### What "Harder" and "Easier" Mean

Remember how clicking works? Your computer tries random numbers until it finds one that produces a hash below a threshold.

- **Harder** = Lower threshold = Fewer numbers work = More attempts needed
- **Easier** = Higher threshold = More numbers work = Fewer attempts needed

### Real-World Analogy

Imagine a lottery where you win if your ticket number is below 1,000:
- If too many people are winning, change it to "below 500" (harder)
- If too few are winning, change it to "below 2,000" (easier)

The game constantly adjusts to maintain a steady pace of token distribution.

---

## Winning an Epoch

### Daily Winner

The player with the most valid clicks in an epoch is the **winner**. There's only one winner per day.

### The Winner Bonus

Winners receive a bonus equal to 10% of what was distributed during that epoch. And yes, this bonus also gets the 50/50 burn treatment.

**Example**:
- During Epoch 5, a total of 1,000,000 tokens were distributed to all players
- Winner bonus = 10% of 1,000,000 = 100,000 tokens
- Winner actually receives = 50,000 tokens (other 50,000 burned)

### Tracking Wins

The game tracks how many epochs each player has won. Bragging rights!

---

## Finalizing Epochs

### What Is Finalization?

When an epoch ends, someone needs to tell the blockchain "this epoch is over, count up the results." This is called **finalizing** the epoch.

### Who Can Finalize?

Anyone! You don't have to be a participant. You just call the `finalizeEpoch` function after the epoch's 24 hours are up.

### The Finalizer Reward

As a thank-you for finalizing, the caller receives 1% of what was distributed during that epoch. Unlike the winner bonus, this is NOT subject to the 50/50 burn - you get the full amount.

**Why?** Because finalization is a necessary task that costs gas (transaction fees). The reward compensates for this and incentivizes people to keep the game running smoothly.

### Automatic Finalization

If nobody manually finalizes an epoch, it happens automatically when someone submits clicks in a later epoch. The game catches up on any un-finalized epochs.

---

## How the Game Ends

### The 90-Day Clock

The game runs for exactly 90 epochs (90 days). After Day 90:

1. No more clicks are accepted
2. The final epoch is finalized
3. Any remaining tokens in the pool are **burned**

### Why Burn the Remainder?

This ensures that:
- The game has a definitive end
- All tokens are either distributed to players or removed from circulation
- There's no leftover pool sitting in a contract forever

### The Final Burn

If players don't claim all the available tokens through clicking (maybe activity died down), whatever's left gets sent to the burn address. The game leaves no tokens behind.

---

## Putting It All Together

Let's walk through a complete example:

### Day 1 Begins

- Pool: 100,000,000 $CLICK
- Daily budget: 2,000,000 $CLICK (2%)
- Difficulty: Starting level

### Alice Plays

1. Alice's browser starts mining (trying random numbers)
2. After a few minutes, she has 75 valid nonces
3. She submits them to the contract
4. Gross reward calculation: 2,000,000 * (75 / 1,000,000) = 150 tokens
5. Alice receives: 75 tokens
6. Burned: 75 tokens
7. Her click count for Day 1: 75

### Bob Plays Too

1. Bob submits 200 valid clicks
2. Bob receives: 200 tokens (half of his 400 gross)
3. Burned: 200 tokens
4. Bob's click count for Day 1: 200

### Day 1 Ends

- Total clicks: 50,000 (from all players)
- This is way below 1M target
- Difficulty decreases by 4x (max adjustment)
- Bob had the most clicks - he's the winner!
- Bob's bonus: 10% of distributed * 50% = some extra tokens
- Charlie finalizes the epoch and gets 1% reward
- Unused portion of daily budget is burned

### Day 2 Begins

- Pool is now smaller (rewards paid out + burns)
- New daily budget: 2% of remaining pool
- Difficulty is easier (more people should be able to click)
- Everyone's click count resets to 0

### ...89 Days Later...

- Pool is nearly empty
- Daily rewards are tiny
- Final epoch ends
- Any remaining tokens are burned
- Game over!

---

## Glossary

| Term | Definition |
|------|------------|
| **Burn** | Permanently destroying tokens by sending them to an inaccessible address |
| **Burn Address** | 0x000000000000000000000000000000000000dEaD - a wallet no one controls |
| **Difficulty** | How hard it is to find valid click proofs; adjusts daily |
| **Epoch** | A 24-hour period; the game has 90 epochs total |
| **Finalize** | The act of officially ending an epoch and distributing bonuses |
| **Hash** | The output of running data through a one-way mathematical function |
| **Nonce** | A random number your computer tries when mining for valid clicks |
| **Pool** | The reserve of tokens available for distribution |
| **Proof-of-Work** | A system where you prove computational effort was expended |
| **Smart Contract** | Code that lives on the blockchain and executes automatically |
| **Target** | The threshold that determines if a hash is "valid" |
| **Threshold** | The maximum hash value allowed for a click to count |

---

## FAQ

### How much can I earn?

It depends on:
- How early you play (bigger pool = bigger rewards)
- How many others are playing (more competition = smaller share)
- How good your hardware is (faster = more valid clicks)

### Is this like Bitcoin mining?

Similar concept, but much simpler. You're mining $CLICK tokens by doing proof-of-work, but:
- It runs in your browser, not specialized hardware
- Difficulty adjusts daily, not every 2 weeks
- The game ends after 90 days

### Why would I play if half my earnings are burned?

Because everyone's earnings are burned equally. If you believe the remaining $CLICK tokens will be valuable due to scarcity, you're collecting scarce tokens while contributing to their scarcity.

### Can I play on multiple devices?

Yes, but they'd all be earning for the same wallet address. More devices = more hashes per second = more valid clicks.

### What happens to the tokens I earn?

They're sent directly to your wallet immediately when you submit valid clicks. No claiming or waiting required.

### What if nobody plays for a whole day?

The epoch still ends after 24 hours. When finalized, the unused daily budget is burned. Difficulty would be adjusted to make the next day easier.

---

## Still Have Questions?

The game is intentionally simple at its core:

1. Click the button
2. Your computer does math
3. You earn tokens
4. Half of everything burns

That's it. That's the stupid clicker.
