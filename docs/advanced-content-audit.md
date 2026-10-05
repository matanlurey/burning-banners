# Advanced base-game content audit

Audit date: 2026-10-05 UTC. This audit adds normalized mechanical facts, not printed artwork, flavor text, or a claim that the runtime already implements every interaction.

`content/advanced-catalog.json` contains all 186 base-game playable cards and all 36 monster counters. Six kingdom information cards are excluded because they are reference aids. Every catalog record was inspected against its source face; OCR located text but did not certify numbers or icons. The publisher's newer **Undying Rules v1.1** corrections take precedence over an older face or August 2024 erratum.

## Sources and authority

| Witness | Role | Location |
| --- | --- | --- |
| Compass Games Undying Rules v1.1 | Publisher authority for rules and card corrections, especially §§14–18 | https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying+Rules+v1.1.pdf |
| Burning Banners VASSAL module v1.7 | Printed-face and finite deck/pool witness; community implementation, not independent official rules authority | https://obj.vassalengine.org/images/8/84/Burning_Banners_v1.7.vmod |
| Existing `content/cards-index.json` | Exact stable IDs and publisher-guide names | Repository |
| Existing `content/cards-mechanical-reference.json` | Earlier 20-card sample, audited rather than assumed correct | Repository |

The inspected rules PDF has SHA-256 `77d904b41730edff5e00b4bba8c61b5dab38dafd5f6e3017ca1140b009e2f3f6`. VASSAL v1.7 has SHA-256 `edf9991723174a2c3105a70bbfe10a96da1f72f17581789d3524f7126a01927e`. Direct web retrieval of the publisher PDF's encoded plus signs returned 404; the existing literal-plus download is the inspected witness.

Source scans remain private research material. The catalog's `sourceFace` strings identify entries inside the module; they are not application image URLs. No source face or flavor text is added to the application bundle by this audit.

## Reconciled inventory

| Kind | Printed records | Notes |
| --- | ---: | --- |
| Spells | 52 | One of each numbered Spell |
| Treasures | 36 | Treasure Hoard #17, #18 and #19 are separate records with rewards 3, 4 and 5 gold |
| Blessings | 60 | Ten per kingdom; Night Enslave #2, #3 and #4 remain three distinct cards |
| Heroes | 38 | Fjordland and Goblins have seven; the other kingdoms have six |
| Land monsters | 29 | Each counter appears once in the land pool |
| Sea monsters | 7 | Each counter appears once in the sea pool |

All 186 card IDs match the existing index. Every card and monster has `verified: true`, meaning **its normalized printed facts and applicable card-guide corrections were visually checked**. It does not mean a dispatcher, UI choice, AI choice or unusual rules interaction has passed a runtime test.

## Record schema and interpretation

Card records include `id`, `name`, `kind`, `kingdom`, `count`, `number`, `cantrip`, `mage`, `tome`, `range`, `targets`, `timing`, `duration`, `effect`, `cost`, `verified`, `source`, and `sourceFace`. Each also has a player-facing `summary` of one or two sentences, at most 30 words. Hero records include `powerName`, `powerLabel`, and nested `power.name`/`power.summary`; Gond has no printed named power, so his UI label is “Combat Rating” while `powerName` remains null.

| Field | Meaning |
| --- | --- |
| `cantrip` | Printed Cantrip permission. A Tome still inherits the accompanying Spell's permission and cannot make a non-Cantrip Spell playable in an opponent's window. |
| `mage` | Printed Mage requirement on the card's left edge, not whether a referenced Hero happens to have Mage. |
| `tome` | Must accompany a Spell played by the same player; canceled with that Spell. |
| `range` | Printed inclusive minimum/maximum hex distance. `null` means no printed range; use explicit targets rather than inventing a range of zero. |
| `targets` | Eligibility facts and source-relative targets. “Friendly” retains the rules' same-kingdom meaning. |
| `timing` | Normalized eligibility windows, not a new response stack. The three Battle Magic windows still control permission. |
| `duration` | Instant, current activation, rest of turn, persistent or an explicit ongoing condition. |
| `effect.type` | Dispatch name: a name slug for Spells/Treasures/Blessings and a power-name slug for Heroes. |
| `cost` | Printed Hero build cost, otherwise `null`. Additional gold, discards, locks, eliminations and revolt costs are explicit effect parameters. |
| `count` | One for each physical record; never merge Enslave or Treasure Hoard records. |

Common effect parameters include `light`/`heavy` combat adjustments, `strike: {light, heavy}`, `choices`, `abilities`, `characteristics`, `movement`, `discardSpells`, `discardRandomSpells`, `drawSpells`, `drawBlessings`, `gainHeroes`, `gainTreasures`, `eliminateCaster`, `eliminateSourceHero`, `lockSource`, `ongoing`, `readyStack`, `finishStack`, `recoverArmy`, `inflictHits`, and `negateHits`. Conditional effects explicitly name their terrain, opponent or stacked Army requirements. Type-specific parameters preserve decisions and corrections.

A strike uses normal Strike rules unless its record overrides them. An out-of-combat monster elimination ordinarily grants no reward. The Four Fingered Fist explicitly grants its stated reward and is a specific exception. `monster.rewardTreasure` applies to victory in its Lair; wandering monsters grant only gold in combat.

Section 9.7 prohibits Strikes against fortified Settlement targets. Earthquake specifically permits ordinary fortified Settlements without a penalty, but **cannot target magically fortified Settlements**. Knives in the Dark explicitly overrides both fortification kinds. A generic Strike must not silently become a normal attack with a fortification modifier.

## Corrected earlier sample data

| Record | Earlier sample | Source-checked value |
| --- | --- | --- |
| Sudden Fog | `cantrip: false` | Cantrip flag is present |
| Tidal Shelter | No range | Range 2 |
| Ice Storm | No range | Range 2 |
| Blazing Hands | Range 0 | No printed range; explicitly affects caster |
| Helm of Domination | No Mage requirement | Mage requirement is printed |
| Dara Firemane power | Range 0 | No printed range; explicitly affects Dara |

The catalog preserves these newer publisher-guide corrections:

- **Summon the Dead** targets a Unit; disregard printed Monster eligibility.
- **Summon Kraken** and **Summon Morag** target Units; disregard Monster/Garrison eligibility. Kraken may use Loch Fossvanet's sea hex; Tsunami may not.
- **Grom's Forge** permits a weakened Orc Reaver despite the older face's Full Strength restriction. It still eliminates the caster and Army after combat.
- **Saffi's Song of Rebirth** affects Fjordland Armies, rather than all the face's loosely named friendly Units, for a full turn.
- **Shield Wall** follows the guide's eligibility for any Fjordland Unit, including its garrisons.
- **Lightning Axes** may be invoked when a Strike is declared during combat; Szark does not gain Stealth. Its extra hit rule overrides the usual Strike limit.
- **Luna's Deadly Assassin** is a Strike for interaction purposes but eliminates the specified target instead of inflicting hits, and cannot create Critical hits.
- **Spellbound** cannot be cast if the player would still be at Full Strength in Spells after playing it.
- **Freyja's Wings of Valor** preserves the saved Hero and its card/lock state. The Hero cannot remain in the elimination hex, even if adjacent to Freyja.
- **Helm of Domination** and **Staff of Plagues** count opposing-player Spells/Treasures both before and after their own play in the current Battle Magic sequence; exclude Blessings and other players' cards.
- **Festering Wounds** modifies only one Critical confirmation into three light dice; additional Criticals use normal confirmation. **Black Diamond** changes confirmation to heavy dice and can chain further Criticals.

## Heroes

Every Hero has a nested `unitDefinition` and separately accessible `power` record. All 38 have Mage. All six Night Heroes and Freyja also have Flying; Lieva and Ariadne have Ranged. All have no base dice except Gond, whose printed one heavy die is already in his unit definition and must not be added twice by his power.

Schema integration must read `card.unitDefinition`, not `card.unit`. Monster records have one-hit elimination and no weakened state.

| Kingdom | Hero pool | Printed build cost |
| --- | ---: | ---: |
| Oathborn | 6 | 3 gold |
| Fjordland | 7 | 2 gold |
| Eastern Empire | 6 | 3 gold |
| Army of the Night | 6 | 3 gold |
| Goblins | 7 | 2 gold |
| Orcs | 6 | 3 gold |

Costs are on kingdom-specific generic Hero backs. Heroes are recruited randomly from the unbuilt pool; selecting a specific Hero requires an explicit card effect. Eliminated Heroes return to that pool at turn end. Heroes have one-hit elimination, so `recoveryCost: 0` and weakened-dice fields are compatibility values, not an ability to weaken or Recover a Hero.

Movement comes from individual fronts: Freyja has 8, Manstrangler 3, most Heroes 6, and slower support Heroes 4. Exact per-Hero values are in the JSON.

Automatic/ongoing powers must not be suppressed merely because their face lacks a Cantrip icon or their Hero card is locked. This applies especially to Thor, Throndil, Horne, Finger Cutter, Weasel Eyes, Iron Skull, Swarm Master, Gond, Karsch, Dominia, Kharis and Bela. Lilith and Dominia's Enslave bonuses remain active while locked. An activated Lock power spends its lock but does not finish the unit.

## Monsters

All 36 fronts were enlarged and inspected for light/heavy dice, Mage/Flying/Ranged/Stealth symbols and reward diamonds. Each is a separate definition with `pool`, `count`, `light`, `heavy`, `abilities`, `rewardGold`, `rewardTreasure`, `strikeRange` and one-hit elimination. No movement, Army build cost, weakened state or generic equipment slot is inferred.

Commanded Strike range is sea 4, otherwise Flying 3, otherwise Mage 2, otherwise 1. Sea range follows eligible Sea/Coastal connections; it is a path constraint, not merely a radius. At most three commanded Monsters per kingdom remains a runtime rule.

Granny Wink and Soot has no reward diamond, normalized to zero gold; its two light dice and Mage are printed. Other rewards and abilities are explicit. Names such as “Feral Orcs” or “Marsh Troll” do not imply unprinted Feral or Regenerate abilities.

## Runtime verification responsibilities

There are no unidentified or untranscribed base-game cards/monster counters here. This catalog does not resolve missing campaign setup books, additional map graphs, publisher licensing or external multiplayer infrastructure.

Exercise these interactions before claiming complete Advanced gameplay:

1. The three Battle Magic windows and allies; a defender cannot answer a final-window Cantrip with Negation or Banished to Meji.
2. A Tome accompanying a canceled Spell or non-Cantrip, and Mage/Ranged caster requirements.
3. Minimum-range 3–5 Strikes, terrain requirements, caster-only/global effects, and Mage Monsters prohibited from elimination/movement Spells.
4. Individual pending hits with Cure Wounds, Tidal Shelter, Sigil of Courage, Ring of Invisibility, Finger Cutter, Freyja and Shapeshift.
5. Army/Hero pickup/dropoff movement, Flying requiring both members, joining a finished unit, siege, mandatory advance and repeat attacks.
6. Treasure ownership/retrieval/selling, no play-and-sell in the same turn, Satchel's four-card winter total, unsellable/unretrievable Curses and unsellable Fountains.
7. Out-of-combat Strikes, wandering/Lair rewards, the Four Fingered Fist exception, fresh/defeated Lairs and command-cap choices.
8. Three independent Enslave cards, Lilith/Dominia bonuses, failure-and-lock card retention, Hero/Settlement restrictions, and enslaved unit state/ownership.
9. Confirmed-critical chains, multiple-success Lightning Axes and Frostheart's Battle-Magic-only Spell block.
10. Every player studies after each kingdom turn, multi-kingdom card ownership, shared discard piles and winter recycling.

Disable or explicitly delimit an unsupported effect rather than invent a generic bonus. `verified` is not executable-effect coverage or a passing play test.
