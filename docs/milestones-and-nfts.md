# Milestones & NFT System

## Dual-Layer Reward System

| Layer | Who | Tracking | Rewards |
|-------|-----|----------|---------|
| On-chain | Scripts + Humans | PoW proofs in contract | $CLICK tokens |
| Off-chain | Humans only | Frontend clicks via server | NFTs, achievements, cosmetics |

## NFT Claim Flow

```
User hits 1,000 clicks
        ↓
Server returns: { newMilestones: ["dedicated"] }
        ↓
Frontend shows modal: "Congrats! You unlocked DEDICATED!"
                      [Mint Your NFT]
        ↓
User clicks Mint → calls server for signature
        ↓
Server verifies eligibility in Redis, signs: "0xAbc... can claim tier 4"
        ↓
User sends tx to NFT contract with signature (pays gas)
        ↓
Contract verifies signature, mints NFT to user
```

## Tier Ranges

| Range | Type | Count | Notes |
|-------|------|-------|-------|
| 1-99 | Personal click milestones | 12 | Editions (many can own) |
| 100-199 | Streak/epoch achievements | 5 | Editions |
| 200-499 | Global 1/1 milestones | ~30 | Only ONE person can ever claim each |
| 500+ | Hidden personal achievements | ~50 | Editions |

## Rarity Scale

| Rarity | Used For |
|--------|----------|
| common | Easy achievements (1-500 clicks) |
| uncommon | Moderate effort (1K-5K clicks, basic streaks) |
| rare | Significant effort (10K-25K clicks, month streak) |
| epic | Major effort (50K-100K clicks, epoch participation) |
| legendary | Exceptional (250K-500K clicks, 90-day streak) |
| mythic | Ultimate (1M+ clicks, global 1/1s) |

---

## Personal Milestones (Tier 1-12) - Editions

| Tier | Name | Clicks | Cursor Reward |
|------|------|--------|---------------|
| 1 | First Timer | 1 | White |
| 2 | Getting Started | 100 | Gray |
| 3 | Warming Up | 500 | Bronze |
| 4 | Dedicated | 1,000 | Bronze Glow |
| 5 | Serious Clicker | 5,000 | Silver |
| 6 | Obsessed | 10,000 | Silver Glow |
| 7 | No Sleep | 25,000 | Gold |
| 8 | Touch Grass | 50,000 | Gold Glow |
| 9 | Legend | 100,000 | Platinum |
| 10 | Ascended | 250,000 | Diamond |
| 11 | Transcendent | 500,000 | Diamond Glow |
| 12 | Click God | 1,000,000 | Cosmic |

---

## Streak & Epoch Achievements (Tier 101-105) - Editions

| Tier | Name | Requirement |
|------|------|-------------|
| 101 | Week Warrior | 7-day streak |
| 102 | Month Master | 30-day streak |
| 103 | Perfect Attendance | 90-day streak |
| 104 | Day One OG | Epoch 1 participant |
| 105 | The Final Day | Final epoch participant |

---

## Global Milestones (Tier 200-229) - 1/1s

Only ONE person can ever claim each of these!

### Main Milestones (200-209)

| Tier | Name | Global Click # |
|------|------|----------------|
| 200 | The First Click | 1 |
| 201 | Century | 100 |
| 202 | Thousandaire | 1,000 |
| 203 | Ten Grand | 10,000 |
| 204 | The Hundred Thousandth | 100,000 |
| 205 | The Millionth Click | 1,000,000 |
| 206 | Ten Million | 10,000,000 |
| 207 | Hundred Million | 100,000,000 |
| 208 | Billionaire | 1,000,000,000 |
| 209 | Ten Billion | 10,000,000,000 |

### Hidden Global 1/1s (220-229)

| Tier | Name | Global Click # |
|------|------|----------------|
| 220 | Nice | 69 |
| 221 | Blaze It | 420 |
| 222 | Devil's Click | 666 |
| 223 | Lucky Sevens | 777 |
| 224 | Elite | 1,337 |
| 225 | Calculator | 8,008 |
| 226 | The Perfect Number | 42,069 |
| 227 | Ultra Nice | 69,420 |
| 228 | Double Blaze | 420,420 |
| 229 | Nice Nice Nice | 696,969 |

---

## Hidden Personal Achievements (Tier 500+) - Editions

Everyone can earn these based on their personal click count.

### Meme Numbers (500-511)

| Tier | Name | Personal Click # |
|------|------|------------------|
| 500 | Nice | 69 |
| 501 | Blaze It | 420 |
| 502 | Devil's Click | 666 |
| 503 | Lucky 7s | 777 |
| 504 | Elite | 1,337 |
| 505 | Calculator | 8,008 |
| 506 | The Perfect Number | 42,069 |
| 507 | Ultra Nice | 69,420 |
| 508 | Double Blaze | 420,420 |
| 509 | Nice Nice Nice | 696,969 |
| 510 | Calculator Masterpiece | 8,008,135 |
| 511 | The Beast | 666,666,666 |

### Ones Family (520-523)

| Tier | Name | Personal Click # |
|------|------|------------------|
| 520 | Triple Ones | 111 |
| 521 | Quad Ones | 1,111 |
| 522 | Make a Wish | 11,111 |
| 523 | Six Ones | 111,111 |

### Sevens Family (524-526)

| Tier | Name | Personal Click # |
|------|------|------------------|
| 524 | Jackpot | 7,777 |
| 525 | Mega Jackpot | 77,777 |
| 526 | Slot Machine God | 777,777 |

### Eights Family (527-529)

| Tier | Name | Personal Click # |
|------|------|------------------|
| 527 | Prosperity | 888 |
| 528 | Very Lucky | 8,888 |
| 529 | Fortune | 888,888 |

### Nines Family (530-532)

| Tier | Name | Personal Click # |
|------|------|------------------|
| 530 | So Close | 999 |
| 531 | Edge Lord | 9,999 |
| 532 | One Away | 999,999 |

### Palindromes (540-545)

| Tier | Name | Personal Click # |
|------|------|------------------|
| 540 | Binary Palindrome | 101 |
| 541 | Bookends | 1,001 |
| 542 | Symmetric | 10,001 |
| 543 | Counting Palindrome | 12,321 |
| 544 | Mirror Mirror | 123,321 |
| 545 | The Mountain | 1,234,321 |

### Math Numbers (560-566)

| Tier | Name | Personal Click # | Notes |
|------|------|------------------|-------|
| 560 | Fine Structure | 137 | Physics constant |
| 561 | Pi Day | 314 | 3.14 |
| 562 | Golden | 1,618 | Golden ratio |
| 563 | Euler's Click | 2,718 | e ≈ 2.718 |
| 564 | Full Pi | 314,159 | |
| 565 | Fibonacci | 112,358 | 1,1,2,3,5,8 |
| 566 | 32-bit Max | 2,147,483,647 | Max int32 |

### Powers of 2 (580-588)

| Tier | Name | Personal Click # | Notes |
|------|------|------------------|-------|
| 580 | Byte | 256 | 2^8 |
| 581 | Half K | 512 | 2^9 |
| 582 | Kilobyte | 1,024 | 2^10 |
| 583 | The Game | 2,048 | 2^11 |
| 584 | 2^12 | 4,096 | |
| 585 | 2^15 | 32,768 | |
| 586 | 2^16 | 65,536 | |
| 587 | Megabyte | 1,048,576 | 2^20 |
| 588 | Gigabyte | 1,073,741,824 | 2^30 |

### Cultural (600-609)

| Tier | Name | Personal Click # | Notes |
|------|------|------------------|-------|
| 600 | Not Found | 404 | HTTP error |
| 601 | Server Error | 500 | HTTP error |
| 602 | Jumbo | 747 | Boeing |
| 603 | Emergency | 911 | |
| 604 | Orwellian | 1,984 | The book |
| 605 | Space Odyssey | 2,001 | |
| 606 | Love You 3000 | 3,000 | MCU |
| 607 | Jenny | 8,675,309 | Tommy Tutone |
| 608 | Seasons of Love | 525,600 | Minutes/year |
| 609 | Seconds in a Day | 86,400 | |

---

## Cosmetic Rewards

### Cursor Progression
Each personal milestone unlocks a cursor. The system supports:
- Main progression: White → Bronze → Silver → Gold → Platinum → Diamond → Cosmic
- Meme themed: Pink (Nice), Green (420), Hellfire (666), etc.
- Streak themed: Fire effects
- Hidden: Holographic, Glitch, special effects

### Button Skins (Future)
- Default red
- Red glow (5,000 clicks)
- Blue (10,000 clicks)
- Purple (50,000 clicks)
- Animated (100,000 clicks)
- Gold + sparkles (500,000 clicks)

---

## Assets Needed

### Cursor PNGs (~95)
Located in `/public/cursors/`
Named to match cursor IDs (e.g., `white.png`, `bronze.png`, `holographic.png`)
Recommended size: 32x32 or 48x48 pixels

### NFT Artwork (~60+)
- Personal milestones (12)
- Streak achievements (5)
- Global 1/1s (~30)
- Hidden achievements (~50)
