// Generated from source-checked campaign facts by build.mjs.
export const publishedCampaignCatalog = {
    "version": 1,
    "researchDate": "2026-10-05",
    "scope": "Source-backed mechanical transcription of all28 named base-game starts, plus Chronicle linking and Bitter End option. Source conflicts explicitly retained; published metadata is distinct from executable certification.",
    "namedStartingSetupCount": 28,
    "publisherAdvertisedScenarioCount": 29,
    "countNote": "Book contents enumerate28 named starts. Full linked Chronicle and Bitter End are additional play modes; publisher advertised29 does not identify a separately numbered29th start.",
    "sources": {
        "spanishPublisherCampaignBook": {
            "url": "https://edicionesmasqueoca.com/diarios/2025/06/12/a-punto-para-pre-produccion/",
            "format": "Publicly served JPEG pages01–60",
            "pages": 60,
            "status": "June2025 Spanish preproduction proofs; publisher explicitly warns these files may contain errors. No source narrative or art redistributed.",
            "manifestSha256": "30ce2757fe37a2946ba652f8c1b1c6d01f9815b7cb349405f954498fa1654011"
        },
        "englishLivingCampaignNotes": {
            "url": "https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying+Campaign+Notes+v.1.0.pdf",
            "date": "September2024"
        },
        "englishErrata": {
            "url": "https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Burning+Banners+Clarifications+%26+Errata+0824.pdf",
            "date": "August2024"
        },
        "campaignsAtAGlanceV4": {
            "source": "User-supplied English overview PDF",
            "sourceFileName": "Campaigns_at_a_Glance_v4.pdf",
            "sha256": "1771288daac98d567bd2837a23ea34188fe0281bd0b35fde1d4cb88cb69a7a58",
            "authority": "Community overview with designer artwork permission; corroborates season counts and maps, not full opening setup."
        },
        "spanishPublisherErrata2026": {
            "url": "https://edicionesmasqueoca.com/diarios/2026/04/06/faqs-y-erratas-detectadas/",
            "status": "Publisher living errata discussion, checked for correction leads; no unverified player proposals substituted for rulebook."
        },
        "englishCampaign7Header": {
            "articleUrl": "https://theboardgameschronicle.com/2024/11/03/burning-banners-session-reports-campaign-7-fire-in-the-fields-of-ash/",
            "imageUrl": "https://i0.wp.com/theboardgameschronicle.com/wp-content/uploads/2024/11/img_3682.jpg",
            "bookPage": 14,
            "authority": "Legible photograph of the published English campaign header; dates and season count verified directly."
        }
    },
    "generalSetup": {
        "pages": [
            3,
            4
        ],
        "rules": [
            "Opening gold is a purchasing allowance: spend on allowed opening units or keep unspent unless scenario overrides.",
            "Listed free units and Heroes must deploy during setup.",
            "Same-side kingdoms normally deploy simultaneously within each specified deployment group.",
            "Opening Night Covens may be placed at hostile settlements without a roll, unless scenario overrides. Feral Night armies may deploy in Wilderness adjacent to Covens.",
            "Revolt begins at0 unless specified. Opening gold may quell revolts.",
            "Non-Flying armies on Sea entry hexes must use Ship movement6 when activated."
        ]
    },
    "chronicle": {
        "sourcePages": [
            36
        ],
        "chapters": 10,
        "books": 3,
        "playOptions": {
            "standaloneChapter": true,
            "linkedChapters": true,
            "fullWar": true,
            "minimumSeasons": 3,
            "maximumSeasons": 35
        },
        "linking": "Choose any starting chapter and any later ending chapter. Use the start chapter's setup and ending chapter's victory conditions. Preserve the evolving game state between chapters rather than resetting to later chapter starting positions.",
        "returnOfFjordland": [
            "Games beginning in chapters5,6,7 start without Fjordland. Fjordland re-enters in Spring596 with chapter8 setup and then cannot collapse.",
            "Games beginning before chapter5: if Fjordland collapses, it returns3 years later during the same season, using chapter8 setup and then cannot collapse."
        ],
        "treaty": {
            "name": "Treaty of Kars Thaya",
            "date": "Winter592",
            "before": "Mara Mitai settlements are hostile to Resistance",
            "after": "Starting Spring593 Mara Mitai settlements are allied with Resistance"
        },
        "turnOrder": "Keep starting order as kingdoms collapse, retaining collapsed banners. On Fjordland's return, before that turn's income phase, reorder to chapter8's order and append Goblins at the end.",
        "abandonedLairs": "Place start chapter's abandoned-lair markers before play. Every Winter from594 onward, at the end of winter stepb (Drums in the Deep), each side places one Abandoned marker at any map lair that does not contain a controlled Monster.",
        "seasonMarker": "Games spanning at least4 chapters use reverse Chronicle season marker, turning90 degrees when moving from year3 back to year1, to track successive three-year periods."
    },
    "settlementAliases": {
        "Bjornfoss": "The Bjornfoss",
        "Heinburg": "The Heinburg",
        "North House": "Nordhome",
        "Hammersol": "Sunehammer",
        "Black Fortress": "Blackstone Fortress",
        "Astrid Fjord": "Astridfjord",
        "Skald Fortress": "Vilkensinger Fortress",
        "Rjukken Hold": "Rjukkenheld",
        "Silverfalls": "Pewter Falls",
        "Draken Hold": "Drakenhold",
        "Katukhas": "Katurkhas",
        "Muffintown": "Muffin Town",
        "Moon Tower": "Spire of the Moon"
    },
    "entries": [
        {
            "id": "intro",
            "number": 0,
            "series": "intro",
            "pages": [
                6
            ],
            "name": "The Invasion of Drefeld",
            "historicalYear": 565,
            "maps": [
                "Wildlands"
            ],
            "players": 2,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Fjordland"
                ],
                "Resistance": [
                    "Oathborn"
                ]
            },
            "turnOrder": [
                "Oathborn",
                "Fjordland"
            ],
            "study": {
                "glyphs": 2,
                "churns": 1
            },
            "deploymentOrder": [
                [
                    "Oathborn"
                ],
                [
                    "Fjordland"
                ]
            ],
            "kingdoms": {
                "Oathborn": {
                    "income": 2,
                    "gold": 6,
                    "heroes": 0,
                    "controls": [
                        "Shaded Vale"
                    ]
                },
                "Fjordland": {
                    "income": 4,
                    "gold": 15,
                    "heroes": 0,
                    "controls": [
                        "Norstead",
                        "Far Tumed"
                    ]
                }
            },
            "postures": {
                "Fort Gorod": {
                    "hostile": [
                        "Oathborn",
                        "Fjordland"
                    ]
                },
                "otherAllowedSettlements": "Welcoming to their starting controlling kingdom."
            },
            "allowedSettlements": [
                "Fort Gorod",
                "Zarinbar",
                "Shaded Vale",
                "Barlas on the Lake",
                "Norstead",
                "Far Tumed"
            ],
            "initialLoyalSettlementControl": {
                "Oathborn": [
                    "Zarinbar",
                    "Shaded Vale"
                ],
                "Fjordland": [
                    "Barlas on the Lake",
                    "Norstead",
                    "Far Tumed"
                ]
            },
            "specialRules": [
                "Use Basic Rules. Only the6 listed settlements may be attacked or occupied."
            ],
            "victory": {
                "deadline": {
                    "type": "most-controlled-settlements",
                    "check": "Autumn-end",
                    "tieWinner": "Oathborn"
                }
            },
            "crosschecks": {
                "livingNotes": "Confirms Fort Gorod hostile and remaining permitted settlements welcoming to opening controller.",
                "campaignsAtAGlanceV4": "User-supplied English overview confirms3 seasons and1 Wildlands board.",
                "quickCardGold": "English corrected quick card7 is unspent gold after fixed quick-start builds; do not overwrite book purchasing budget15."
            }
        },
        {
            "number": 1,
            "pages": [
                7
            ],
            "name": "Fight to the Death",
            "titleSpanish": "Lucha a Muerte",
            "historicalYear": 556,
            "maps": [
                "Wildlands"
            ],
            "players": 2,
            "turns": 5,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "sides": {
                "Invader": [
                    "Orcs"
                ],
                "Resistance": [
                    "Goblins"
                ]
            },
            "turnOrder": [
                "Orcs",
                "Goblins"
            ],
            "study": {
                "glyphs": 2,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Oathborn",
                        "Fjordland"
                    ],
                    "prohibited": [
                        "Army of the Night"
                    ]
                },
                "Resistance": {
                    "hostile": [
                        "Neutral",
                        "Oathborn",
                        "Fjordland"
                    ],
                    "prohibited": [
                        "Army of the Night"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Orcs"
                ],
                [
                    "Goblins"
                ]
            ],
            "kingdoms": {
                "Orcs": {
                    "income": null,
                    "gold": 15,
                    "heroes": 1
                },
                "Goblins": {
                    "income": null,
                    "gold": 20,
                    "heroes": 1
                }
            },
            "specialRules": [],
            "victory": {
                "immediate": [
                    {
                        "type": "opponent-collapse",
                        "winner": "surviving-opponent"
                    }
                ],
                "deadline": {
                    "type": "most-controlled-settlements",
                    "tieWinner": "orcs"
                }
            },
            "end": {
                "year": 2,
                "season": "Summer"
            },
            "id": "campaign-1",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 2,
            "pages": [
                8,
                9
            ],
            "name": "The Jarl’s War",
            "titleSpanish": "La Guerra del Jarl",
            "historicalYear": 572,
            "maps": [
                "Broken Coast",
                "Imperial Heartland"
            ],
            "players": 2,
            "turns": 5,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "sides": {
                "Invader": [
                    "Eastern Empire"
                ],
                "Resistance": [
                    "Fjordland"
                ]
            },
            "turnOrder": [
                "Fjordland",
                "Eastern Empire"
            ],
            "study": {
                "glyphs": 2,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild"
                    ],
                    "prohibited": [
                        "Oathborn",
                        "Mara Mitai"
                    ]
                },
                "Resistance": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild"
                    ],
                    "prohibited": [
                        "Oathborn",
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Eastern Empire"
                ],
                [
                    "Fjordland"
                ]
            ],
            "kingdoms": {
                "Eastern Empire": {
                    "income": 11,
                    "gold": 28,
                    "heroes": 1,
                    "controls": [
                        "Skegheld",
                        "Felstoft",
                        "Belgunot"
                    ]
                },
                "Fjordland": {
                    "income": 7,
                    "gold": 9,
                    "heroes": 1
                }
            },
            "specialRules": [
                {
                    "type": "empire-revolt",
                    "start": 3,
                    "rollModifier": 1
                }
            ],
            "victory": {
                "immediate": [
                    {
                        "type": "income-at-or-below",
                        "winner": "empire",
                        "target": "fjordland",
                        "threshold": 4,
                        "check": "end-of-fjordland-turn"
                    },
                    {
                        "type": "income-at-or-below",
                        "winner": "fjordland",
                        "target": "empire",
                        "threshold": 7,
                        "ignoreRevolts": true,
                        "check": "end-of-empire-turn"
                    }
                ],
                "deadline": {
                    "type": "most-victory-points",
                    "controlMarkerPoints": 1,
                    "advancedTreasureMajorityPoints": 1,
                    "treasuresInclude": [
                        "owned",
                        "in-hand"
                    ],
                    "tieWinner": "fjordland"
                }
            },
            "end": {
                "year": 2,
                "season": "Summer"
            },
            "variants": [
                {
                    "id": "long-war",
                    "end": {
                        "year": 3,
                        "season": "autumn"
                    },
                    "durationSeasons": 9,
                    "winterCount": 2,
                    "empireRevoltModifierChange": {
                        "at": {
                            "year": 2,
                            "season": "autumn"
                        },
                        "value": -1
                    },
                    "victoryUnchanged": true
                }
            ],
            "id": "campaign-2",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 3,
            "pages": [
                10
            ],
            "name": "The Great Goblin Raid",
            "titleSpanish": "La Gran Incursión Goblin",
            "historicalYear": 581,
            "maps": [
                "Broken Coast"
            ],
            "players": 2,
            "turns": 6,
            "start": {
                "year": 1,
                "season": "Summer"
            },
            "sides": {
                "Invader": [
                    "Goblins"
                ],
                "Resistance": [
                    "Fjordland"
                ]
            },
            "turnOrder": [
                "Goblins",
                "Fjordland"
            ],
            "study": {
                "glyphs": 2,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Oathborn"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Oathborn"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Fjordland"
                ],
                [
                    "Goblins"
                ]
            ],
            "kingdoms": {
                "Fjordland": {
                    "income": 8,
                    "gold": 18,
                    "heroes": 1
                },
                "Goblins": {
                    "income": null,
                    "gold": 25,
                    "heroes": 1
                }
            },
            "specialRules": [],
            "victory": {
                "immediate": [
                    {
                        "type": "controlled-settlement-count",
                        "winner": "goblins",
                        "controller": "goblins",
                        "loyalty": [
                            "fjordland"
                        ],
                        "threshold": 2,
                        "check": "season-end"
                    }
                ],
                "deadline": {
                    "type": "prevent-invader-victory",
                    "winner": "fjordland"
                }
            },
            "end": {
                "year": 3,
                "season": "Spring"
            },
            "id": "campaign-3",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 4,
            "pages": [
                11
            ],
            "name": "Orcs on the Deepwater",
            "titleSpanish": "Orcos en el Aguas Profundas",
            "historicalYear": 584,
            "maps": [
                "Fields of Ash"
            ],
            "players": 2,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "sides": {
                "Invader": [
                    "Orcs"
                ],
                "Resistance": [
                    "Oathborn"
                ]
            },
            "turnOrder": [
                "Orcs",
                "Oathborn"
            ],
            "study": {
                "glyphs": 2,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Eastern Empire"
                    ],
                    "prohibited": [
                        "Mara Mitai"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "allied": [
                        "Eastern Empire"
                    ],
                    "prohibited": [
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Oathborn"
                ],
                [
                    "Orcs"
                ]
            ],
            "kingdoms": {
                "Oathborn": {
                    "income": 8,
                    "gold": 15,
                    "heroes": 1
                },
                "Orcs": {
                    "income": null,
                    "gold": 16,
                    "heroes": 1
                }
            },
            "specialRules": [
                {
                    "type": "oathborn-opening-miners",
                    "placement": "mines within distance2 of any Oathborn settlement"
                }
            ],
            "victory": {
                "immediate": [
                    {
                        "type": "controlled-or-razed-settlement-count",
                        "winner": "orcs",
                        "controller": "orcs",
                        "loyalty": [
                            "neutral",
                            "oathborn"
                        ],
                        "threshold": 6,
                        "check": "season-end"
                    }
                ],
                "deadline": {
                    "type": "prevent-invader-victory",
                    "winner": "oathborn"
                },
                "ignoredSettlementLoyalty": [
                    "empire"
                ]
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "id": "campaign-4",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 5,
            "pages": [
                12
            ],
            "name": "Approaching Thunder",
            "titleSpanish": "El trueno que se avecina",
            "historicalYear": 584,
            "maps": [
                "Wildlands",
                "Fields of Ash"
            ],
            "players": 2,
            "turns": 6,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "sides": {
                "Invader": [
                    "Orcs"
                ],
                "Resistance": [
                    "Oathborn"
                ]
            },
            "turnOrder": [
                "Orcs",
                "Oathborn"
            ],
            "study": {
                "glyphs": 2,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Eastern Empire",
                        "Fjordland"
                    ],
                    "prohibited": [
                        "Mara Mitai",
                        "Army of the Night"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "allied": [
                        "Eastern Empire",
                        "Fjordland"
                    ],
                    "prohibited": [
                        "Mara Mitai",
                        "Army of the Night"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Oathborn"
                ],
                [
                    "Orcs"
                ]
            ],
            "kingdoms": {
                "Oathborn": {
                    "income": 11,
                    "gold": 22,
                    "heroes": 2
                },
                "Orcs": {
                    "income": null,
                    "gold": 30,
                    "heroes": 2
                }
            },
            "specialRules": [
                {
                    "type": "oathborn-opening-miners",
                    "placement": "mines within distance2 of any Oathborn settlement"
                },
                {
                    "type": "scenario-garrison",
                    "hex": "Spire of the Moon",
                    "appliesTo": "all",
                    "advancedOnly": true,
                    "enter": false,
                    "transit": false
                }
            ],
            "victory": {
                "immediate": [
                    {
                        "type": "controlled-or-razed-settlement-count",
                        "winner": "orcs",
                        "controller": "orcs",
                        "loyalty": [
                            "neutral",
                            "oathborn"
                        ],
                        "threshold": 10,
                        "check": "season-end"
                    }
                ],
                "deadline": {
                    "type": "prevent-invader-victory",
                    "winner": "oathborn"
                },
                "ignoredSettlementLoyalty": [
                    "empire",
                    "fjordland"
                ]
            },
            "end": {
                "year": 2,
                "season": "Autumn"
            },
            "id": "campaign-5",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 6,
            "pages": [
                13
            ],
            "name": "The Spire of the Moon",
            "titleSpanish": "La Torre de la Luna",
            "historicalYear": 588,
            "maps": [
                "Wildlands"
            ],
            "players": 2,
            "turns": 5,
            "start": {
                "year": 1,
                "season": "Summer"
            },
            "sides": {
                "Invader": [
                    "Army of the Night"
                ],
                "Resistance": [
                    "Oathborn"
                ]
            },
            "turnOrder": [
                "Army of the Night",
                "Oathborn"
            ],
            "study": {
                "glyphs": 2,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Fjordland"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "allied": [
                        "Fjordland"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Oathborn"
                ],
                [
                    "Army of the Night"
                ]
            ],
            "kingdoms": {
                "Oathborn": {
                    "income": 6,
                    "gold": 10,
                    "heroes": 1
                },
                "Army of the Night": {
                    "income": 4,
                    "gold": 6,
                    "covens": 1,
                    "heroes": 1
                }
            },
            "specialRules": [
                {
                    "type": "oathborn-opening-miners",
                    "placement": "mines within distance2 of any Oathborn settlement"
                }
            ],
            "victory": {
                "immediate": [
                    {
                        "type": "compound-control-count",
                        "winner": "army-of-night",
                        "controller": "army-of-night",
                        "controlMarkersTotal": 5,
                        "controlMarkersOnOathbornSettlementsAtLeast": 2,
                        "check": "season-end"
                    }
                ],
                "deadline": {
                    "type": "prevent-invader-victory",
                    "winner": "oathborn"
                }
            },
            "end": {
                "year": 2,
                "season": "Autumn"
            },
            "id": "campaign-6",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 7,
            "pages": [
                14,
                15
            ],
            "name": "Fire in the Fields of Ash",
            "titleSpanish": "Fuego en los Campos de Ceniza",
            "historicalYear": 589,
            "maps": [
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 4,
            "turns": 6,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "sides": {
                "Invader": [
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Eastern Empire",
                    "Oathborn"
                ]
            },
            "turnOrder": [
                "Orcs",
                "Oathborn",
                "Army of the Night",
                "Eastern Empire"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai",
                        "Fjordland"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild",
                        "Mara Mitai"
                    ],
                    "allied": [
                        "Fjordland"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Eastern Empire",
                    "Oathborn"
                ],
                [
                    "Army of the Night",
                    "Orcs"
                ]
            ],
            "kingdoms": {
                "Eastern Empire": {
                    "income": 17,
                    "gold": 20,
                    "heroes": 1
                },
                "Oathborn": {
                    "income": 8,
                    "gold": 12,
                    "heroes": 1
                },
                "Army of the Night": {
                    "income": 1,
                    "gold": 15,
                    "covens": 2,
                    "heroes": 1,
                    "controls": "one chosen predeployment control"
                },
                "Orcs": {
                    "income": null,
                    "gold": 24,
                    "heroes": 1
                }
            },
            "specialRules": [
                {
                    "type": "empire-revolt",
                    "start": 2
                },
                {
                    "type": "oathborn-opening-miners",
                    "placement": "mines within distance2 of any Oathborn settlement"
                }
            ],
            "victory": {
                "immediate": [
                    {
                        "type": "combined-control-markers",
                        "winner": "invader-team",
                        "controllers": [
                            "orcs",
                            "army-of-night"
                        ],
                        "threshold": 11,
                        "check": "season-end"
                    }
                ],
                "deadline": {
                    "type": "prevent-invader-victory",
                    "winner": "resistance-team"
                }
            },
            "endPrinted": {
                "year": 2,
                "season": "Autumn"
            },
            "preDeployment": [
                {
                    "kingdom": "army-of-night",
                    "choice": "place one Control on any Imperial Heartland non-city settlement before any kingdom recruits"
                }
            ],
            "variants": [
                {
                    "id": "first-among-equals",
                    "type": "competitive-invaders",
                    "teamRulesStillApply": true,
                    "ifInvadersWin": {
                        "nightWinsIfControlMarkerLeadAtLeast": 2,
                        "otherwiseWinner": "orcs"
                    }
                }
            ],
            "id": "campaign-7",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            },
            "sourceWitnesses": [
                {
                    "source": "Spanish MQO preproduction proof",
                    "pages": [
                        14,
                        15
                    ],
                    "start": {
                        "year": 1,
                        "season": "Summer"
                    },
                    "endPrinted": {
                        "year": 2,
                        "season": "Spring"
                    },
                    "status": "Superseded by photographed final English header."
                },
                {
                    "source": "Photograph of published English Campaign Book page14",
                    "articleUrl": "https://theboardgameschronicle.com/2024/11/03/burning-banners-session-reports-campaign-7-fire-in-the-fields-of-ash/",
                    "imageUrl": "https://i0.wp.com/theboardgameschronicle.com/wp-content/uploads/2024/11/img_3682.jpg",
                    "start": {
                        "year": 1,
                        "season": "Spring"
                    },
                    "end": {
                        "year": 2,
                        "season": "Autumn"
                    },
                    "turns": 6
                }
            ],
            "end": {
                "year": 2,
                "season": "Autumn"
            },
            "resolvedSourceConflicts": [
                "Final English header specifies Spring1–Autumn2: six play seasons because Winter is an interphase. Spanish draft dates were superseded."
            ]
        },
        {
            "number": 8,
            "pages": [
                16,
                17
            ],
            "name": "Goblin Apocalypse",
            "titleSpanish": "Apocalipsis Goblin",
            "historicalYear": 589,
            "maps": [
                "Broken Coast",
                "Wildlands"
            ],
            "players": 5,
            "turns": 6,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "sides": {
                "Invader": [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Oathborn",
                    "Fjordland"
                ]
            },
            "turnOrder": [
                "Goblins",
                "Fjordland",
                "Army of the Night",
                "Orcs",
                "Oathborn"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Fjordland",
                    "Oathborn"
                ],
                [
                    "Army of the Night",
                    "Orcs",
                    "Goblins"
                ]
            ],
            "kingdoms": {
                "Fjordland": {
                    "income": 9,
                    "gold": 5,
                    "heroes": 1
                },
                "Oathborn": {
                    "income": 6,
                    "gold": 12,
                    "heroes": 1
                },
                "Army of the Night": {
                    "income": 4,
                    "gold": 15,
                    "covens": 1,
                    "heroes": 1
                },
                "Orcs": {
                    "income": null,
                    "gold": 18,
                    "heroes": 1
                },
                "Goblins": {
                    "income": null,
                    "gold": 33,
                    "heroes": 2
                }
            },
            "specialRules": [
                {
                    "type": "oathborn-opening-miners",
                    "placement": "mines within distance2 of any Oathborn settlement"
                }
            ],
            "victory": {
                "immediate": [
                    {
                        "type": "army-occupies",
                        "winner": "invader-team",
                        "hex": "Dwelfholm",
                        "check": "end-of-oathborn-turn"
                    },
                    {
                        "type": "army-occupies",
                        "winner": "resistance-team",
                        "hex": "Spire of the Moon",
                        "check": "end-of-army-of-night-turn"
                    }
                ],
                "deadline": {
                    "type": "combined-controlled-settlement-count",
                    "controllers": [
                        "goblins",
                        "army-of-night",
                        "orcs"
                    ],
                    "loyalty": [
                        "oathborn",
                        "fjordland",
                        "assassins-guild"
                    ],
                    "threshold": 7,
                    "winnerIfThreshold": "invader-team",
                    "otherwiseWinner": "resistance-team"
                }
            },
            "end": {
                "year": 2,
                "season": "Autumn"
            },
            "id": "campaign-8",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 9,
            "pages": [
                18,
                19
            ],
            "name": "Marauders in the Empire",
            "titleSpanish": "Saqueadores en el Imperio",
            "historicalYear": 593,
            "maps": [
                "Imperial Heartland"
            ],
            "players": 2,
            "turns": 6,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "sides": {
                "Invader": [
                    "Goblins"
                ],
                "Resistance": [
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Goblins",
                "Eastern Empire"
            ],
            "study": {
                "glyphs": 2,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai"
                    ],
                    "allied": [
                        "Army of the Night"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Goblins"
                ],
                [
                    "Eastern Empire"
                ]
            ],
            "kingdoms": {
                "Goblins": {
                    "income": null,
                    "gold": 28,
                    "heroes": 1,
                    "controlsSpanish": [
                        "Fortaleza del Escaldo",
                        "Bastión Rjukken"
                    ]
                },
                "Eastern Empire": {
                    "income": 9,
                    "gold": 16,
                    "heroes": 1,
                    "freeUnits": [
                        {
                            "kingdom": "fjordland",
                            "name": "Raider",
                            "weak": true,
                            "count": 1
                        },
                        {
                            "kingdom": "fjordland",
                            "name": "Ranger",
                            "weak": true,
                            "count": 1
                        },
                        {
                            "kingdom": "fjordland",
                            "name": "Hero",
                            "count": 1,
                            "advancedOnly": true
                        }
                    ],
                    "freeUnitsPlacement": "at an Imperial settlement or adjacent to one"
                }
            },
            "specialRules": [
                {
                    "type": "empire-revolt",
                    "start": 2
                },
                {
                    "type": "nonplayer-control",
                    "kingdom": "army-of-night",
                    "hex": "Megas"
                },
                {
                    "type": "fjordland-allied-units",
                    "activatedBy": "empire",
                    "recoverUsing": "empire-gold",
                    "cannotRebuild": true,
                    "disableFjordlandBlessings": true
                },
                {
                    "type": "goblin-entry-override",
                    "hexes": "all sea hexes along north board edge"
                }
            ],
            "victory": {
                "immediate": [
                    {
                        "type": "all-loyal-settlements-controlled-or-razed",
                        "winner": "goblins",
                        "controller": "goblins",
                        "loyalty": [
                            "empire"
                        ]
                    },
                    {
                        "type": "kingdom-collapse",
                        "target": "goblins",
                        "winner": "empire"
                    }
                ],
                "deadline": {
                    "type": "controls-named-settlement",
                    "hex": "Aureliana",
                    "controller": "goblins",
                    "winnerIfTrue": "goblins",
                    "otherwiseWinner": "empire"
                }
            },
            "end": {
                "year": 2,
                "season": "Autumn"
            },
            "id": "campaign-9",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 10,
            "pages": [
                20,
                21
            ],
            "name": "Last Stand in the East",
            "titleSpanish": "La Última Resistencia en el Este",
            "historicalYear": 593,
            "maps": [
                "Fields of Ash"
            ],
            "players": 4,
            "turns": 6,
            "start": {
                "year": 1,
                "season": "Summer"
            },
            "sides": {
                "Invader": [
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Orcs",
                "Oathborn",
                "Army of the Night",
                "Eastern Empire"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Mara Mitai"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "allied": [
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Eastern Empire",
                    "Oathborn"
                ],
                [
                    "Orcs",
                    "Army of the Night"
                ]
            ],
            "kingdoms": {
                "Eastern Empire": {
                    "income": 6,
                    "gold": 10,
                    "heroes": 1
                },
                "Oathborn": {
                    "income": 8,
                    "gold": 10,
                    "heroes": 1
                },
                "Orcs": {
                    "income": null,
                    "gold": 25,
                    "heroes": 1,
                    "controlsSpanish": [
                        "Cañada Sombría",
                        "Cataratas Plateadas",
                        "Cestae",
                        "Darhad",
                        "Puente del Sur",
                        "Puerto Gilder",
                        "Budar"
                    ],
                    "controlPlacementException": "omit Orc marker if Night chose one of these settlements"
                },
                "Army of the Night": {
                    "income": 2,
                    "gold": 5,
                    "covens": 1,
                    "heroes": 1,
                    "controls": "one chosen predeployment control"
                }
            },
            "specialRules": [
                {
                    "type": "empire-revolt",
                    "start": 0,
                    "rollModifier": 2
                },
                {
                    "type": "extra-entry",
                    "kingdom": "empire",
                    "hexSpanish": "Paso de Agra",
                    "description": "two hexes south of Placidia"
                },
                {
                    "type": "initial-razed",
                    "hexesSpanish": [
                        "Urut",
                        "Yurku",
                        "Dungkha",
                        "Khotan Khong",
                        "Katurkas",
                        "Puerto Lark"
                    ]
                },
                {
                    "type": "collapse-eligibility",
                    "eligibleKingdoms": [
                        "orcs"
                    ],
                    "othersCannotCollapse": true
                }
            ],
            "victory": {
                "immediate": [
                    {
                        "type": "city-count-controlled-or-razed",
                        "winner": "invader-team",
                        "controllers": [
                            "orcs",
                            "army-of-night"
                        ],
                        "threshold": 3,
                        "cities": "all3 on board"
                    },
                    {
                        "type": "kingdom-collapse",
                        "target": "orcs",
                        "winner": "resistance-team"
                    }
                ],
                "deadline": {
                    "type": "city-count-controlled-or-razed",
                    "controllers": [
                        "orcs",
                        "army-of-night"
                    ],
                    "threshold": 2,
                    "winnerIfThreshold": "invader-team",
                    "otherwiseWinner": "resistance-team"
                }
            },
            "end": {
                "year": 3,
                "season": "Spring"
            },
            "preDeployment": [
                {
                    "kingdom": "army-of-night",
                    "choice": "place one Control on any neutral or loyal non-city settlement before any kingdom recruits"
                }
            ],
            "id": "campaign-10",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 11,
            "pages": [
                22,
                23
            ],
            "name": "Across the Oskolton",
            "titleSpanish": "Cruzando el Oskolton",
            "historicalYear": 593,
            "maps": [
                "Broken Coast"
            ],
            "players": 3,
            "turns": 4,
            "start": {
                "year": 1,
                "season": "Summer"
            },
            "sides": {
                "Invader": [
                    "Goblins",
                    "Army of the Night"
                ],
                "Resistance": [
                    "Oathborn"
                ]
            },
            "turnOrder": [
                "Army of the Night",
                "Oathborn",
                "Goblins"
            ],
            "study": {
                "glyphs": 3,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Fjordland"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Fjordland"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Army of the Night",
                    "Goblins"
                ],
                [
                    "Oathborn"
                ]
            ],
            "kingdoms": {
                "Army of the Night": {
                    "income": 4,
                    "gold": 5,
                    "covens": 1,
                    "heroes": 1,
                    "controlsSpanish": [
                        "Fiordo Astrid",
                        "Adakirk",
                        "Felstoft",
                        "Fortaleza Negra"
                    ],
                    "controlMarkersAvailable": 5
                },
                "Goblins": {
                    "income": null,
                    "gold": 8,
                    "heroes": 1,
                    "controlsSpanish": [
                        "The Bjornfoss",
                        "Belgunot",
                        "Skegheld"
                    ],
                    "controlMarkersAvailable": 5
                },
                "Oathborn": {
                    "income": 4,
                    "gold": 17,
                    "heroes": 1
                }
            },
            "specialRules": [
                {
                    "type": "initial-razed",
                    "hexesSpanish": [
                        "Gorpin",
                        "Casa del Norte",
                        "The Heinburg",
                        "Seekirk",
                        "Altojardin",
                        "Odgervik"
                    ]
                },
                {
                    "type": "extra-entry",
                    "kingdom": "oathborn",
                    "hexes": "the two eastern hexes adjacent to Barzirak"
                },
                {
                    "type": "raze-removal-discount",
                    "kingdom": "oathborn",
                    "cost": 0
                },
                {
                    "type": "fixed-defender",
                    "kingdom": "fjordland",
                    "unit": "Berserker",
                    "hexSpanish": "Martillosol",
                    "canDefend": true,
                    "canMove": false,
                    "canRecover": false,
                    "canAct": false
                },
                {
                    "type": "coven-hide-check",
                    "hexSpanish": "Martillosol",
                    "ifFjordlandBerserkerPresent": true,
                    "during": "each-oathborn-turn",
                    "failure": "eliminate-coven",
                    "reference": "12.3.5"
                }
            ],
            "victory": {
                "immediate": [
                    {
                        "type": "kingdom-collapse",
                        "target": "goblins",
                        "winner": "oathborn"
                    }
                ],
                "deadline": {
                    "type": "settlements-with-friendly-unit-or-control",
                    "kingdom": "oathborn",
                    "threshold": 3,
                    "winnerIfThreshold": "oathborn",
                    "otherwiseWinner": "invader-team"
                }
            },
            "end": {
                "year": 2,
                "season": "Summer"
            },
            "id": "campaign-11",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 12,
            "pages": [
                24,
                25
            ],
            "name": "Goblin High Tide",
            "historicalYear": 593,
            "maps": [
                "Broken Coast",
                "Imperial Heartland"
            ],
            "players": 4,
            "turns": 6,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 2,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Goblins",
                    "Army of the Night"
                ],
                "Resistance": [
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Army of the Night",
                "Oathborn",
                "Goblins",
                "Eastern Empire"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Mara Mitai",
                        "Assassins Guild",
                        "Fjordland"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Fjordland",
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Goblins",
                    "Army of the Night"
                ],
                [
                    "Eastern Empire",
                    "Oathborn"
                ]
            ],
            "kingdoms": {
                "Goblins": {
                    "income": null,
                    "gold": 35,
                    "heroes": 2,
                    "controls": [
                        "The Bjornfoss",
                        "Belgunot",
                        "Skegheld",
                        "Vilkensinger Fortress",
                        "Rjukkenheld"
                    ],
                    "setupRules": [
                        "Spend all opening gold; discard unspent gold.",
                        "At most 8 opening gold may purchase units on Broken Coast; spend the balance on Imperial Heartland."
                    ]
                },
                "Army of the Night": {
                    "income": 7,
                    "gold": 5,
                    "covens": 0,
                    "heroes": 1,
                    "controls": [
                        "Astridfjord",
                        "Adakirk",
                        "Felstoft",
                        "Blackstone Fortress",
                        "Megas"
                    ],
                    "controlMarkerCap": 5,
                    "setupRules": [
                        "August2024 official English errata removes the opening Coven; Night may remove one own Control during initial Income Actions to gain a Coven."
                    ]
                },
                "Eastern Empire": {
                    "income": 9,
                    "gold": 16,
                    "heroes": 1,
                    "revolt": 2,
                    "extraUnits": [
                        {
                            "kingdom": "Fjordland",
                            "type": "Raider",
                            "weakened": true
                        },
                        {
                            "kingdom": "Fjordland",
                            "type": "Ranger",
                            "weakened": true
                        }
                    ],
                    "extraHeroes": [
                        {
                            "kingdom": "Fjordland",
                            "count": 1
                        }
                    ],
                    "extraDeployment": "Imperial settlement or adjacent hex"
                },
                "Oathborn": {
                    "income": 4,
                    "gold": 17,
                    "heroes": 1
                }
            },
            "razed": [
                "Gorpin",
                "Nordhome",
                "The Heinburg",
                "Seekirk",
                "Highgarden",
                "Odgervik"
            ],
            "entry": {
                "Oathborn": "East-edge hexes adjacent to Barzirak on Broken Coast"
            },
            "specialRules": [
                "Fjordland units activate on Imperial turns, recover using Imperial gold, cannot be rebuilt, and cannot use Fjordland blessings.",
                "Army of the Night cannot transfer gold to Goblins.",
                "Oathborn remove Razed markers for zero gold.",
                "Place a Fjordland Berserker army at Sunehammer. It only defends that settlement; cannot move, recover, or act. Any Night Coven placed there while it remains must pass Hide in Shadows during every Oathborn turn or be eliminated."
            ],
            "victory": {
                "check": "End of each season starting Spring historical year594 (game year2)",
                "instant": {
                    "side": "Invader",
                    "condition": "At least5 Goblin control markers remain on the playable map"
                },
                "otherwise": "Resistance wins at campaign end or if Goblins collapse"
            },
            "id": "campaign-12",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            },
            "sourceCorrections": [
                "C12 opening Coven removed per August2024 official English errata page2."
            ]
        },
        {
            "number": 13,
            "pages": [
                26,
                27
            ],
            "name": "Orcs at the Gate",
            "historicalYear": 595,
            "maps": [
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 3,
            "turns": 8,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 3,
                "season": "Summer"
            },
            "sides": {
                "Invader": [
                    "Orcs",
                    "Army of the Night"
                ],
                "Resistance": [
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Orcs",
                "Eastern Empire",
                "Army of the Night"
            ],
            "study": {
                "glyphs": 3,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Fjordland",
                        "Mara Mitai",
                        "Oathborn"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Fjordland",
                        "Mara Mitai",
                        "Oathborn"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Orcs",
                    "Army of the Night"
                ],
                [
                    "Eastern Empire"
                ]
            ],
            "kingdoms": {
                "Orcs": {
                    "income": null,
                    "gold": 20,
                    "heroes": 1,
                    "controls": [
                        "Southbridge",
                        "Darhad",
                        "Alyttium",
                        "Placidia",
                        "Agra Yakoo",
                        "Zawikosa"
                    ]
                },
                "Army of the Night": {
                    "income": 4,
                    "gold": 8,
                    "heroes": 1,
                    "controls": [
                        "Megas",
                        "Vilkensinger Fortress"
                    ],
                    "controlMarkerCap": 2,
                    "optionalSetup": "Replace one Night control marker with Razed to receive a Coven; place that Coven at any hostile settlement."
                },
                "Eastern Empire": {
                    "income": 12,
                    "gold": 20,
                    "heroes": 1,
                    "revolt": 4,
                    "extraUnits": [
                        {
                            "kingdom": "Fjordland",
                            "type": "Raider",
                            "weakened": true
                        },
                        {
                            "kingdom": "Fjordland",
                            "type": "Ranger",
                            "weakened": true
                        }
                    ],
                    "extraHeroes": [
                        {
                            "kingdom": "Fjordland",
                            "count": 1
                        }
                    ],
                    "extraDeployment": "Imperial settlement or adjacent hex",
                    "setupRules": [
                        "Opening gold may quell revolts."
                    ]
                }
            },
            "razed": [
                "Auger",
                "Highbridge",
                "Yurku",
                "Urut",
                "Dungkha",
                "Drakenhold",
                "Khotan Khong",
                "Port Gilder",
                "Katurkhas",
                "Budar",
                "Port Talonshield",
                "Barukil",
                "Shadowglen",
                "Cestae",
                "Pewter Falls",
                "Port Lark"
            ],
            "abandonedLairs": "All Fields of Ash lairs",
            "specialRules": [
                "Fjordland units activate on Imperial turns, recover using Imperial gold and settlements, cannot be rebuilt, and cannot use Fjordland blessings.",
                "If Invader has not won by Autumn game year1, Army of the Night withdraws during that winter: remove its Covens and Heroes; replace its controls with Razed markers; remove its kingdom board, gold, built units, controls and blessings; monsters it controls escape per15.4.2. For the rest of the campaign it may neither recruit nor recover units nor collect gold. Any remaining Night unit entering a hostile settlement razes it.",
                "Publisher suggests two players, with one controlling both invader kingdoms, because Night may withdraw."
            ],
            "victory": {
                "side": "Invader",
                "condition": "Both Aureliana and Placidia are Razed or controlled by Invader",
                "otherwise": "Eastern Empire wins at campaign end"
            },
            "id": "campaign-13",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 14,
            "pages": [
                28
            ],
            "name": "Return of the Long Ships",
            "historicalYear": 596,
            "maps": [
                "Broken Coast"
            ],
            "players": 2,
            "turns": 6,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 2,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Army of the Night"
                ],
                "Resistance": [
                    "Fjordland"
                ]
            },
            "turnOrder": [
                "Fjordland",
                "Army of the Night"
            ],
            "study": {
                "glyphs": 2,
                "churns": 1
            },
            "deploymentOrder": [
                [
                    "Army of the Night"
                ],
                [
                    "Fjordland"
                ]
            ],
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Oathborn"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Oathborn"
                    ]
                }
            },
            "kingdoms": {
                "Army of the Night": {
                    "income": 6,
                    "gold": 14,
                    "heroes": 1,
                    "controls": [
                        "Barzirak",
                        "The Bjornfoss",
                        "Astridfjord",
                        "Blackstone Fortress",
                        "Adakirk",
                        "Felstoft"
                    ]
                },
                "Fjordland": {
                    "income": 7,
                    "gold": 25,
                    "heroes": 2
                }
            },
            "razed": [
                "Gorpin",
                "The Heinburg",
                "Nordhome",
                "Seekirk",
                "Odgervik",
                "Skegheld"
            ],
            "nonPlayerControls": {
                "Oathborn": [
                    "Belgunot"
                ]
            },
            "entry": {
                "Fjordland": "Five complete western sea-edge hexes; partial western edge hexes are unplayable"
            },
            "specialRules": [
                "Fjordland cannot deploy initially at Sunehammer or its adjacent hexes.",
                "Fjordland entering Oathborn-controlled Belgunot removes that control marker and peacefully restores Fjordland loyalty, without Loot."
            ],
            "victory": {
                "check": "Campaign end",
                "side": "Resistance",
                "condition": "Fjordland controls at least6 settlements; Fjordland-loyal settlements under Oathborn control do not count",
                "otherwise": "Army of the Night wins"
            },
            "id": "campaign-14",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 15,
            "pages": [
                30,
                31
            ],
            "name": "Against the Spire",
            "historicalYear": 599,
            "maps": [
                "Wildlands"
            ],
            "players": 3,
            "turns": 5,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 2,
                "season": "Summer"
            },
            "sides": {
                "Invader": [
                    "Army of the Night"
                ],
                "Resistance": [
                    "Fjordland",
                    "Oathborn"
                ]
            },
            "turnOrder": [
                "Fjordland",
                "Army of the Night",
                "Oathborn"
            ],
            "study": {
                "glyphs": 3,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Fjordland",
                    "Oathborn"
                ],
                [
                    "Army of the Night"
                ]
            ],
            "kingdoms": {
                "Fjordland": {
                    "income": 7,
                    "gold": 8,
                    "heroes": 1,
                    "cannotCollapse": true
                },
                "Oathborn": {
                    "income": 7,
                    "gold": 20,
                    "heroes": 1,
                    "controls": [
                        "Arulud",
                        "Mangut"
                    ],
                    "cannotCollapse": true,
                    "setupRules": [
                        "Miners may deploy at mines within2 hexes of an Oathborn settlement."
                    ]
                },
                "Army of the Night": {
                    "income": 12,
                    "gold": 25,
                    "covens": 1,
                    "heroes": 2,
                    "fixedHero": "Lilith, Queen of the Night",
                    "randomHeroes": 1,
                    "controls": [
                        "Barlas on the Lake",
                        "Norstead",
                        "Khorikar"
                    ]
                }
            },
            "razed": [
                "Chanos",
                "Far Tumed",
                "Zarinbar",
                "Fort Gorod",
                "Shaded Vale"
            ],
            "entry": {
                "Oathborn": "All southern map-edge hexes",
                "Fjordland": "Five western sea-edge hexes and three western road-entry hexes: Dwelfholm trade route, Felstoft road, Skegheld road"
            },
            "specialRules": [
                "Place Osterloch face-up at the Spire of the Moon, removed from monster supply. There he is a Night-controlled Fragile army rather than a Monster. He cannot leave except by elimination. Night cannot enter or build at the Tower while he occupies it; Night units built adjacent to the Tower enter Prepared."
            ],
            "victory": {
                "instant": {
                    "side": "Resistance",
                    "condition": "A Resistance army occupies the Spire of the Moon"
                },
                "otherwise": "Invader wins at campaign end"
            },
            "id": "campaign-15",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 16,
            "pages": [
                32,
                33
            ],
            "name": "Assault in the North",
            "historicalYear": 599,
            "maps": [
                "Broken Coast",
                "Wildlands"
            ],
            "players": 3,
            "turns": 5,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 2,
                "season": "Summer"
            },
            "sides": {
                "Invader": [
                    "Army of the Night"
                ],
                "Resistance": [
                    "Fjordland",
                    "Oathborn"
                ]
            },
            "turnOrder": [
                "Fjordland",
                "Army of the Night",
                "Oathborn"
            ],
            "study": {
                "glyphs": 3,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Fjordland",
                    "Oathborn"
                ],
                [
                    "Army of the Night"
                ]
            ],
            "kingdoms": {
                "Fjordland": {
                    "income": 15,
                    "gold": 10,
                    "heroes": 1,
                    "controls": [
                        "Gorpin",
                        "The Heinburg",
                        "Nordhome",
                        "Seekirk"
                    ],
                    "cannotCollapse": true
                },
                "Oathborn": {
                    "income": 10,
                    "gold": 28,
                    "heroes": 1,
                    "controls": [
                        "Arulud",
                        "Mangut",
                        "Highgarden"
                    ],
                    "cannotCollapse": true,
                    "setupRules": [
                        "Miners may deploy at mines within2 hexes of an Oathborn settlement."
                    ]
                },
                "Army of the Night": {
                    "income": 15,
                    "gold": 33,
                    "covens": 1,
                    "heroes": 2,
                    "fixedHero": "Lilith, Queen of the Night",
                    "randomHeroes": 1,
                    "controls": [
                        "Barlas on the Lake",
                        "Norstead",
                        "Khorikar",
                        "The Bjornfoss",
                        "Adakirk",
                        "Felstoft"
                    ]
                }
            },
            "razed": [
                "Chanos",
                "Far Tumed",
                "Zarinbar",
                "Fort Gorod",
                "Shaded Vale"
            ],
            "entry": {
                "Oathborn": "All southern map-edge hexes"
            },
            "specialRules": [
                "Place Osterloch face-up at the Spire of the Moon, removed from monster supply. There he is a Night-controlled Fragile army rather than a Monster. He cannot leave except by elimination. Night cannot enter or build at the Tower while he occupies it; Night units built adjacent to the Tower enter Prepared."
            ],
            "victory": {
                "instant": {
                    "side": "Resistance",
                    "condition": "A Resistance army occupies the Spire of the Moon"
                },
                "otherwise": "Invader wins at campaign end"
            },
            "id": "campaign-16",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "number": 17,
            "pages": [
                34,
                35
            ],
            "name": "The Undead Empress",
            "historicalYear": 604,
            "maps": [
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 4,
            "turns": 6,
            "start": {
                "year": 1,
                "season": "Autumn"
            },
            "end": {
                "year": 3,
                "season": "Summer"
            },
            "sides": {
                "Invader": [
                    "Eastern Empire",
                    "Army of the Night"
                ],
                "Resistance": [
                    "Fjordland",
                    "Oathborn"
                ]
            },
            "turnOrder": [
                "Eastern Empire",
                "Fjordland",
                "Army of the Night",
                "Oathborn"
            ],
            "study": {
                "glyphs": 3,
                "churns": 1
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                },
                "Resistance": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                }
            },
            "preDeployment": "Before any other kingdom recruits, Army of the Night places2 control markers at any Neutral settlements on the playable map.",
            "deploymentOrder": [
                [
                    "Oathborn"
                ],
                [
                    "Eastern Empire"
                ],
                [
                    "Fjordland"
                ],
                [
                    "Army of the Night"
                ]
            ],
            "kingdoms": {
                "Oathborn": {
                    "income": 6,
                    "gold": 15,
                    "heroes": 1,
                    "setupRules": [
                        "Miners may deploy at mines within2 hexes of an Oathborn settlement."
                    ]
                },
                "Eastern Empire": {
                    "income": 16,
                    "gold": 12,
                    "heroes": 1,
                    "unavailableHeroes": [
                        "Sofia"
                    ]
                },
                "Fjordland": {
                    "income": 5,
                    "gold": 20,
                    "heroes": 1,
                    "controls": [
                        "Megas",
                        "Muffin Town"
                    ]
                },
                "Army of the Night": {
                    "income": 2,
                    "gold": 15,
                    "covens": 1,
                    "heroes": 1,
                    "controls": "2 player-selected Neutral settlements chosen before all deployment",
                    "unavailableHeroes": [
                        "Kali, the Hooded Reaper",
                        "Luna, the Mist Hunter"
                    ]
                }
            },
            "victory": {
                "instant": {
                    "side": "Either",
                    "condition": "First side whose army occupies a hostile City wins"
                },
                "end": {
                    "condition": "Greater side income wins; deduct Imperial revolts and exclude Coven-generated gold",
                    "tie": "Invader"
                }
            },
            "id": "campaign-17",
            "series": "scroll",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms standalone season and board counts."
            }
        },
        {
            "id": "chronicle-1",
            "chapter": 1,
            "book": 1,
            "pages": [
                38,
                39
            ],
            "historicalYear": 589,
            "maps": [
                "Broken Coast",
                "Wildlands",
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 6,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Goblins",
                "Fjordland",
                "Army of the Night",
                "Eastern Empire",
                "Orcs",
                "Oathborn"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ],
                [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ]
            ],
            "kingdoms": {
                "Oathborn": {
                    "income": 12,
                    "gold": 24,
                    "heroes": 1,
                    "controls": [],
                    "setupRules": [
                        "Miners may deploy within2 hexes of an Oathborn settlement."
                    ]
                },
                "Eastern Empire": {
                    "income": 17,
                    "gold": 9,
                    "heroes": 1,
                    "controls": [],
                    "revolt": 6,
                    "setupRules": [
                        "Opening gold may quell revolts."
                    ]
                },
                "Fjordland": {
                    "income": 12,
                    "gold": 5,
                    "heroes": 1,
                    "controls": []
                },
                "Army of the Night": {
                    "income": 4,
                    "gold": 16,
                    "heroes": 2,
                    "controls": [
                        "One selected before recruitment"
                    ],
                    "covens": 3
                },
                "Orcs": {
                    "income": null,
                    "gold": 32,
                    "heroes": 1,
                    "controls": []
                },
                "Goblins": {
                    "income": null,
                    "gold": 35,
                    "heroes": 1,
                    "controls": []
                }
            },
            "specialRules": [],
            "preDeployment": "Before recruitment, Night places1 control at any non-City Imperial settlement on Imperial Heartland or Fields of Ash; reduce affected kingdom income by1 if the settlement was loyal.",
            "victory": {
                "instant": [
                    {
                        "side": "Invader",
                        "check": "season-end",
                        "condition": "Control2 Resistance Cities"
                    },
                    {
                        "side": "Resistance",
                        "condition": "Army of the Night collapses"
                    }
                ],
                "deadline": {
                    "side": "Invader",
                    "condition": "Control at least20 settlements including at least7 Resistance-loyal",
                    "otherwise": "Resistance"
                }
            },
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms3 seasons and4 boards for this standalone chapter."
            },
            "series": "chronicle",
            "name": "Out of the Shadows"
        },
        {
            "id": "chronicle-2",
            "chapter": 2,
            "book": 1,
            "pages": [
                40,
                41
            ],
            "historicalYear": 590,
            "maps": [
                "Broken Coast",
                "Wildlands",
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 6,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Goblins",
                "Fjordland",
                "Army of the Night",
                "Eastern Empire",
                "Orcs",
                "Oathborn"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ],
                [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ]
            ],
            "kingdoms": {
                "Oathborn": {
                    "income": 14,
                    "gold": 24,
                    "heroes": 1,
                    "controls": [
                        "Highgarden",
                        "Khorikar",
                        "Highbridge",
                        "Southbridge"
                    ]
                },
                "Fjordland": {
                    "income": 12,
                    "gold": 25,
                    "heroes": 1,
                    "controls": []
                },
                "Eastern Empire": {
                    "income": 15,
                    "gold": 20,
                    "heroes": 1,
                    "controls": [
                        "Pewter Falls"
                    ],
                    "revolt": 3,
                    "setupRules": [
                        "Opening gold may quell revolts."
                    ]
                },
                "Army of the Night": {
                    "income": 10,
                    "gold": 25,
                    "heroes": 2,
                    "controls": [
                        "Blackstone Fortress",
                        "Norstead",
                        "Megas",
                        "Farsund",
                        "Port Castinus",
                        "Beledi"
                    ],
                    "covens": 2
                },
                "Orcs": {
                    "income": null,
                    "gold": 32,
                    "heroes": 1,
                    "controls": [
                        "Mangut",
                        "Chanos",
                        "Fort Gorod",
                        "Zarinbar",
                        "Yurku",
                        "Port Gilder",
                        "Shadowglen",
                        "Katurkhas",
                        "Budar"
                    ]
                },
                "Goblins": {
                    "income": null,
                    "gold": 33,
                    "heroes": 1,
                    "controls": [
                        "Nordhome",
                        "The Heinburg",
                        "Seekirk",
                        "Barzirak"
                    ]
                }
            },
            "specialRules": [],
            "razed": [
                "Gorpin",
                "Auger",
                "Cestae",
                "Khotan Khong",
                "Dungkha"
            ],
            "victory": {
                "instant": [
                    {
                        "side": "Invader",
                        "check": "season-end",
                        "condition": "Control2 Resistance Cities"
                    },
                    {
                        "side": "Resistance",
                        "condition": "Army of the Night collapses"
                    }
                ],
                "deadline": {
                    "side": "Invader",
                    "condition": "Control at least10 Resistance-loyal settlements including at least1 City",
                    "otherwise": "Resistance"
                }
            },
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms3 seasons and4 boards for this standalone chapter."
            },
            "series": "chronicle",
            "name": "With Fire and Steel"
        },
        {
            "id": "chronicle-3",
            "chapter": 3,
            "book": 1,
            "pages": [
                42,
                43
            ],
            "historicalYear": 591,
            "maps": [
                "Broken Coast",
                "Wildlands",
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 6,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Goblins",
                "Fjordland",
                "Army of the Night",
                "Eastern Empire",
                "Orcs",
                "Oathborn"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ],
                [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ]
            ],
            "kingdoms": {
                "Eastern Empire": {
                    "income": 16,
                    "gold": 25,
                    "heroes": 1,
                    "controls": [
                        "Pewter Falls"
                    ],
                    "revolt": 3,
                    "setupRules": [
                        "Opening gold may quell revolts."
                    ]
                },
                "Fjordland": {
                    "income": 9,
                    "gold": 15,
                    "heroes": 2,
                    "controls": [
                        "Nordhome"
                    ]
                },
                "Oathborn": {
                    "income": 13,
                    "gold": 20,
                    "heroes": 1,
                    "controls": [
                        "Highgarden",
                        "Khorikar",
                        "Highbridge",
                        "Southbridge"
                    ]
                },
                "Army of the Night": {
                    "income": 12,
                    "gold": 25,
                    "heroes": 2,
                    "controls": [
                        "Blackstone Fortress",
                        "Adakirk",
                        "Felstoft",
                        "Megas",
                        "Farsund",
                        "Port Castinus",
                        "Beledi",
                        "Norstead"
                    ],
                    "covens": 2
                },
                "Orcs": {
                    "income": null,
                    "gold": 35,
                    "heroes": 1,
                    "controls": [
                        "Mangut",
                        "Fort Gorod",
                        "Zarinbar",
                        "Urut",
                        "Yurku",
                        "Port Gilder",
                        "Darhad",
                        "Budar",
                        "Shadowglen",
                        "Port Lark"
                    ]
                },
                "Goblins": {
                    "income": null,
                    "gold": 33,
                    "heroes": 1,
                    "controls": [
                        "The Heinburg",
                        "Seekirk",
                        "Belgunot",
                        "The Bjornfoss",
                        "Barzirak",
                        "Nal Narag"
                    ]
                }
            },
            "specialRules": [],
            "razed": [
                "Gorpin",
                "Chanos",
                "Dungkha",
                "Khotan Khong",
                "Katurkhas"
            ],
            "victory": {
                "instant": [
                    {
                        "side": "Invader",
                        "check": "season-end",
                        "condition": "Control2 Resistance Cities"
                    },
                    {
                        "side": "Resistance",
                        "condition": "Army of the Night collapses"
                    }
                ],
                "deadline": {
                    "side": "Invader",
                    "condition": "No additional deadline win condition",
                    "otherwise": "Resistance"
                }
            },
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms3 seasons and4 boards for this standalone chapter."
            },
            "series": "chronicle",
            "name": "In the Fangs of the Beast"
        },
        {
            "id": "chronicle-4",
            "chapter": 4,
            "book": 1,
            "pages": [
                44,
                45
            ],
            "historicalYear": 592,
            "maps": [
                "Broken Coast",
                "Wildlands",
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 6,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Goblins",
                "Fjordland",
                "Army of the Night",
                "Eastern Empire",
                "Orcs",
                "Oathborn"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ],
                [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ]
            ],
            "kingdoms": {
                "Eastern Empire": {
                    "income": 15,
                    "gold": 25,
                    "heroes": 1,
                    "controls": [],
                    "revolt": 3,
                    "setupRules": [
                        "Opening gold may quell revolts."
                    ]
                },
                "Fjordland": {
                    "income": 4,
                    "gold": 20,
                    "heroes": 2,
                    "controls": []
                },
                "Oathborn": {
                    "income": 13,
                    "gold": 20,
                    "heroes": 1,
                    "controls": [
                        "Khorikar",
                        "Highbridge"
                    ]
                },
                "Army of the Night": {
                    "income": 12,
                    "gold": 25,
                    "heroes": 2,
                    "controls": [
                        "Blackstone Fortress",
                        "Adakirk",
                        "Felstoft",
                        "Megas",
                        "Farsund",
                        "Port Castinus",
                        "Beledi",
                        "Norstead"
                    ],
                    "covens": 2
                },
                "Orcs": {
                    "income": null,
                    "gold": 35,
                    "heroes": 1,
                    "controls": [
                        "Far Tumed",
                        "Zarinbar",
                        "Oronar",
                        "Urut",
                        "Yurku",
                        "Southbridge",
                        "Darhad",
                        "Port Gilder",
                        "Shadowglen"
                    ]
                },
                "Goblins": {
                    "income": null,
                    "gold": 33,
                    "heroes": 1,
                    "controls": [
                        "Arulud",
                        "Belgunot",
                        "The Bjornfoss",
                        "Odgervik",
                        "Skegheld"
                    ]
                }
            },
            "specialRules": [
                "Publisher suggests5 players with one Resistance player sharing Fjordland with another kingdom."
            ],
            "razed": [
                "Gorpin",
                "The Heinburg",
                "Nordhome",
                "Seekirk",
                "Highgarden",
                "Chanos",
                "Mangut",
                "Dungkha",
                "Khotan Khong",
                "Katurkhas"
            ],
            "sourceConflicts": [
                "Oronar is named in both official English living notes and Spanish book but is absent from the audited Wildlands base-map settlement list; resolve before exact setup.",
                "Opening control settlement Oronar requires matching to the audited English board."
            ],
            "victory": {
                "instant": [
                    {
                        "side": "Invader",
                        "check": "season-end",
                        "condition": "Control3 Resistance Cities"
                    },
                    {
                        "side": "Resistance",
                        "condition": "Army of the Night collapses"
                    }
                ],
                "deadline": {
                    "side": "Invader",
                    "condition": "No additional deadline win condition",
                    "otherwise": "Resistance"
                }
            },
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms3 seasons and4 boards for this standalone chapter."
            },
            "series": "chronicle",
            "name": "Wolves of the North"
        },
        {
            "id": "chronicle-5",
            "chapter": 5,
            "book": 2,
            "pages": [
                46,
                47
            ],
            "historicalYear": 593,
            "maps": [
                "Broken Coast",
                "Wildlands",
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 5,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Goblins",
                "Eastern Empire",
                "Orcs",
                "Oathborn",
                "Army of the Night"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai",
                        "Fjordland"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Mara Mitai",
                        "Fjordland"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Oathborn",
                    "Eastern Empire"
                ],
                [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ]
            ],
            "kingdoms": {
                "Eastern Empire": {
                    "income": 14,
                    "gold": 26,
                    "heroes": 2,
                    "controls": [],
                    "revolt": 2,
                    "setupRules": [
                        "Opening gold may quell revolts."
                    ],
                    "extraUnits": [
                        {
                            "kingdom": "Fjordland",
                            "type": "Raider",
                            "weakened": true
                        },
                        {
                            "kingdom": "Fjordland",
                            "type": "Ranger",
                            "weakened": true
                        }
                    ],
                    "extraHeroes": [
                        {
                            "kingdom": "Fjordland",
                            "count": 1
                        }
                    ],
                    "extraUnitRules": "Activate on Imperial turns; cannot stack with Imperial units; recover using Imperial gold; cannot be rebuilt; Fjordland blessings unavailable."
                },
                "Oathborn": {
                    "income": 4,
                    "gold": 23,
                    "heroes": 2,
                    "controls": [
                        "Khorikar"
                    ]
                },
                "Army of the Night": {
                    "income": 11,
                    "gold": 28,
                    "heroes": 2,
                    "controls": [
                        "Felstoft",
                        "Adakirk",
                        "Astridfjord",
                        "Blackstone Fortress",
                        "Megas",
                        "Barlas on the Lake",
                        "Norstead"
                    ],
                    "covens": 2
                },
                "Orcs": {
                    "income": null,
                    "gold": 40,
                    "heroes": 2,
                    "controls": [
                        "Budar",
                        "Shadowglen",
                        "Cestae",
                        "Pewter Falls",
                        "Darhad",
                        "Southbridge",
                        "Port Gilder",
                        "Fort Gorod",
                        "Zarinbar"
                    ],
                    "optionalUnits": [
                        "Siege Engine"
                    ]
                },
                "Goblins": {
                    "income": null,
                    "gold": 28,
                    "heroes": 2,
                    "controls": [
                        "The Bjornfoss",
                        "Belgunot",
                        "Skegheld",
                        "Vilkensinger Fortress",
                        "Rjukkenheld",
                        "Nal Narag"
                    ],
                    "optionalUnits": [
                        "Siege Engine"
                    ]
                }
            },
            "specialRules": [
                "Place1 stationary Fjordland Berserker army at Sunehammer; it only defends there, cannot move, recover or act. A Night Coven there must pass Hide in Shadows every Oathborn turn while the Berserker remains, or be eliminated."
            ],
            "razed": [
                "Gorpin",
                "Nordhome",
                "The Heinburg",
                "Seekirk",
                "Highgarden",
                "Odgervik",
                "Arulud",
                "Chanos",
                "Mangut",
                "Far Tumed",
                "Yurku",
                "Urut",
                "Dungkha",
                "Khotan Khong",
                "Katurkhas",
                "Port Lark"
            ],
            "victory": {
                "instant": [
                    {
                        "side": "Resistance",
                        "condition": "Army of the Night collapses"
                    },
                    {
                        "side": "Invader",
                        "condition": "Both Oathborn and Eastern Empire collapse"
                    }
                ],
                "deadline": {
                    "side": "Invader",
                    "condition": "Control at least4 Resistance-loyal Cities",
                    "otherwise": "Resistance"
                }
            },
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms3 seasons and4 boards for this standalone chapter."
            },
            "series": "chronicle",
            "name": "The Sword is Broken"
        },
        {
            "id": "chronicle-6",
            "chapter": 6,
            "book": 2,
            "pages": [
                48,
                49
            ],
            "historicalYear": 594,
            "maps": [
                "Broken Coast",
                "Wildlands",
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 5,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Goblins",
                "Eastern Empire",
                "Orcs",
                "Oathborn",
                "Army of the Night"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai",
                        "Fjordland"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Mara Mitai",
                        "Fjordland"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Oathborn",
                    "Eastern Empire"
                ],
                [
                    "Goblins",
                    "Army of the Night",
                    "Orcs"
                ]
            ],
            "kingdoms": {
                "Eastern Empire": {
                    "income": 15,
                    "gold": 16,
                    "heroes": 2,
                    "controls": [],
                    "revolt": 2,
                    "setupRules": [
                        "Opening gold may quell revolts."
                    ],
                    "extraUnits": [
                        {
                            "kingdom": "Fjordland",
                            "type": "Raider",
                            "weakened": true
                        },
                        {
                            "kingdom": "Fjordland",
                            "type": "Ranger",
                            "weakened": true
                        }
                    ],
                    "extraHeroes": [
                        {
                            "kingdom": "Fjordland",
                            "count": 1
                        }
                    ],
                    "extraUnitRules": "Activate on Imperial turns; cannot stack with Imperial units; recover using Imperial gold; cannot be rebuilt; Fjordland blessings unavailable."
                },
                "Oathborn": {
                    "income": 7,
                    "gold": 23,
                    "heroes": 2,
                    "controls": [
                        "Khorikar",
                        "Belgunot",
                        "Highgarden"
                    ]
                },
                "Army of the Night": {
                    "income": 12,
                    "gold": 28,
                    "heroes": 2,
                    "controls": [
                        "Felstoft",
                        "Adakirk",
                        "Blackstone Fortress",
                        "Sunehammer",
                        "Astridfjord",
                        "The Bjornfoss",
                        "Barlas on the Lake",
                        "Norstead"
                    ],
                    "covens": 1
                },
                "Orcs": {
                    "income": null,
                    "gold": 30,
                    "heroes": 2,
                    "controls": [
                        "Auger",
                        "Highbridge",
                        "Southbridge",
                        "Drakenhold",
                        "Darhad",
                        "Alyttium",
                        "Agra Yakoo",
                        "Zawikosa",
                        "Port Talonshield",
                        "Fort Gorod",
                        "Zarinbar"
                    ]
                },
                "Goblins": {
                    "income": null,
                    "gold": 27,
                    "heroes": 2,
                    "controls": [
                        "Vilkensinger Fortress",
                        "Rjukkenheld"
                    ]
                }
            },
            "specialRules": [
                "Place1 stationary Fjordland Berserker army at Sunehammer; it only defends there, cannot move, recover or act. A Night Coven there must pass Hide in Shadows every Oathborn turn while the Berserker remains, or be eliminated."
            ],
            "razed": [
                "Gorpin",
                "Nordhome",
                "The Heinburg",
                "Seekirk",
                "Odgervik",
                "Skegheld",
                "Nal Narag",
                "Arulud",
                "Chanos",
                "Mangut",
                "Far Tumed",
                "Urut",
                "Yurku",
                "Dungkha",
                "Khotan Khong",
                "Port Gilder",
                "Katurkhas",
                "Budar",
                "Barukil",
                "Shadowglen",
                "Cestae",
                "Pewter Falls",
                "Port Lark"
            ],
            "victory": {
                "instant": [
                    {
                        "side": "Resistance",
                        "condition": "Army of the Night collapses"
                    },
                    {
                        "side": "Invader",
                        "condition": "Both Oathborn and Eastern Empire collapse"
                    }
                ],
                "deadline": {
                    "side": "Invader",
                    "condition": "Control at least5 Resistance-loyal Cities",
                    "otherwise": "Resistance"
                }
            },
            "abandonedLairs": "All Fields of Ash lairs",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms3 seasons and4 boards for this standalone chapter."
            },
            "series": "chronicle",
            "name": "World on Fire"
        },
        {
            "id": "chronicle-7",
            "chapter": 7,
            "book": 2,
            "pages": [
                50,
                51
            ],
            "historicalYear": 595,
            "maps": [
                "Broken Coast",
                "Wildlands",
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 4,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Orcs",
                "Eastern Empire",
                "Army of the Night",
                "Oathborn"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai",
                        "Fjordland"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Mara Mitai",
                        "Fjordland"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Army of the Night",
                    "Orcs"
                ],
                [
                    "Oathborn",
                    "Eastern Empire"
                ]
            ],
            "kingdoms": {
                "Orcs": {
                    "income": null,
                    "gold": 20,
                    "heroes": 1,
                    "controls": [
                        "Southbridge",
                        "Darhad",
                        "Alyttium",
                        "Placidia",
                        "Agra Yakoo",
                        "Zawikosa"
                    ]
                },
                "Army of the Night": {
                    "income": 14,
                    "gold": 28,
                    "heroes": 2,
                    "controls": [
                        "Felstoft",
                        "Adakirk",
                        "Blackstone Fortress",
                        "Sunehammer",
                        "Astridfjord",
                        "The Bjornfoss",
                        "Megas",
                        "Vilkensinger Fortress",
                        "Barlas on the Lake",
                        "Norstead"
                    ]
                },
                "Eastern Empire": {
                    "income": 12,
                    "gold": 20,
                    "heroes": 1,
                    "controls": [
                        "Beledi"
                    ],
                    "revolt": 2,
                    "setupRules": [
                        "Opening gold may quell revolts."
                    ],
                    "extraUnits": [
                        {
                            "kingdom": "Fjordland",
                            "type": "Raider",
                            "weakened": true
                        },
                        {
                            "kingdom": "Fjordland",
                            "type": "Ranger",
                            "weakened": true
                        }
                    ],
                    "extraHeroes": [
                        {
                            "kingdom": "Fjordland",
                            "count": 1
                        }
                    ],
                    "extraUnitRules": "Activate on Imperial turns; cannot stack with Imperial units; recover using Imperial gold; cannot be rebuilt; Fjordland blessings unavailable."
                },
                "Oathborn": {
                    "income": 7,
                    "gold": 20,
                    "heroes": 1,
                    "controls": [
                        "Khorikar",
                        "Belgunot",
                        "Highgarden"
                    ]
                }
            },
            "specialRules": [],
            "razed": [
                "Gorpin",
                "Nordhome",
                "The Heinburg",
                "Seekirk",
                "Odgervik",
                "Skegheld",
                "Nal Narag",
                "Arulud",
                "Chanos",
                "Mangut",
                "Far Tumed",
                "Fort Gorod",
                "Zarinbar",
                "Auger",
                "Highbridge",
                "Urut",
                "Yurku",
                "Dungkha",
                "Drakenhold",
                "Khotan Khong",
                "Port Gilder",
                "Katurkhas",
                "Port Talonshield",
                "Budar",
                "Barukil",
                "Shadowglen",
                "Cestae",
                "Pewter Falls",
                "Port Lark"
            ],
            "sourceCorrections": [
                "Wildlands Razed list follows September2024 English living notes, removing draft Zarinar."
            ],
            "victory": {
                "instant": [
                    {
                        "side": "Resistance",
                        "condition": "Army of the Night collapses"
                    },
                    {
                        "side": "Invader",
                        "condition": "Both Oathborn and Eastern Empire collapse"
                    }
                ],
                "deadline": {
                    "side": "Invader",
                    "condition": "No additional deadline win condition",
                    "otherwise": "Resistance"
                }
            },
            "abandonedLairs": "All Fields of Ash lairs",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms3 seasons and4 boards for this standalone chapter."
            },
            "series": "chronicle",
            "name": "The Longest Night"
        },
        {
            "id": "chronicle-8",
            "chapter": 8,
            "book": 3,
            "pages": [
                52,
                53
            ],
            "historicalYear": 596,
            "maps": [
                "Broken Coast",
                "Wildlands",
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 5,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Fjordland",
                "Army of the Night",
                "Eastern Empire",
                "Orcs",
                "Oathborn"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Army of the Night",
                    "Orcs"
                ],
                [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ]
            ],
            "kingdoms": {
                "Orcs": {
                    "income": null,
                    "gold": 20,
                    "heroes": 1,
                    "controls": [
                        "Muffin Town",
                        "Placidia",
                        "Gallienus"
                    ]
                },
                "Army of the Night": {
                    "income": 14,
                    "gold": 30,
                    "heroes": 2,
                    "controls": [
                        "Barzirak",
                        "The Bjornfoss",
                        "Astridfjord",
                        "Blackstone Fortress",
                        "Adakirk",
                        "Felstoft",
                        "Vilkensinger Fortress",
                        "Barlas on the Lake",
                        "Norstead",
                        "Khorikar"
                    ],
                    "optionalSetup": "Replace one own Control with Razed to receive1 Coven placed at any hostile settlement."
                },
                "Eastern Empire": {
                    "income": 10,
                    "gold": 25,
                    "heroes": 1,
                    "controls": [],
                    "revolt": 3,
                    "setupRules": [
                        "Opening gold may quell revolts."
                    ],
                    "extraDeployment": "Rjukkenheld or adjacent hex",
                    "extraUnits": [
                        {
                            "kingdom": "Fjordland",
                            "type": "Raider",
                            "weakened": true
                        },
                        {
                            "kingdom": "Fjordland",
                            "type": "Ranger",
                            "weakened": true
                        }
                    ],
                    "extraHeroes": [
                        {
                            "kingdom": "Fjordland",
                            "count": 1
                        }
                    ],
                    "extraUnitRules": "Activate on Imperial turns; cannot stack with Imperial units; recover using Imperial gold; cannot be rebuilt; Fjordland blessings unavailable."
                },
                "Oathborn": {
                    "income": 6,
                    "gold": 28,
                    "heroes": 1,
                    "controls": [
                        "Khorikar",
                        "Belgunot",
                        "Highgarden"
                    ]
                },
                "Fjordland": {
                    "income": 7,
                    "gold": 25,
                    "heroes": 2,
                    "controls": [],
                    "cannotCollapse": true
                }
            },
            "specialRules": [],
            "razed": [
                "Gorpin",
                "Nordhome",
                "The Heinburg",
                "Seekirk",
                "Odgervik",
                "Skegheld",
                "Nal Narag",
                "Arulud",
                "Chanos",
                "Mangut",
                "Far Tumed",
                "Zarinar",
                "Fort Gorod",
                "Zarinbar",
                "Beledi"
            ],
            "razedBoardExcept": {
                "Fields of Ash": [
                    "Placidia",
                    "Muffin Town"
                ]
            },
            "entry": {
                "Fjordland": "Five sea-edge entry hexes on Broken Coast (draft says east; requires source clarification)"
            },
            "sourceConflicts": [
                "Khorikar is listed as both Night and Oathborn control.",
                "Draft mentions eastern sea-edge; board ocean is western.",
                "Zarinar in Wildlands Razed list is absent from audited base map; only chapter7 was explicitly corrected in living notes.",
                "Khorikar appears in opening controls for both Army of the Night and Oathborn."
            ],
            "victory": {
                "instant": [
                    {
                        "side": "Resistance",
                        "condition": "Army of the Night collapses"
                    },
                    {
                        "side": "Invader",
                        "condition": "Both Oathborn and Eastern Empire collapse"
                    }
                ],
                "deadline": {
                    "side": "Invader",
                    "condition": "No additional deadline win condition",
                    "otherwise": "Resistance"
                }
            },
            "abandonedLairs": "All Fields of Ash lairs",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms3 seasons and4 boards for this standalone chapter."
            },
            "series": "chronicle",
            "name": "The Sword Reforged"
        },
        {
            "id": "chronicle-9",
            "chapter": 9,
            "book": 3,
            "pages": [
                54,
                55
            ],
            "historicalYear": 597,
            "maps": [
                "Broken Coast",
                "Wildlands",
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 5,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Army of the Night",
                    "Orcs"
                ],
                "Resistance": [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Fjordland",
                "Army of the Night",
                "Eastern Empire",
                "Orcs",
                "Oathborn"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Army of the Night",
                    "Orcs"
                ],
                [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ]
            ],
            "kingdoms": {
                "Orcs": {
                    "income": null,
                    "gold": 10,
                    "heroes": 1,
                    "controls": [
                        "Muffin Town",
                        "Rjukkenheld"
                    ]
                },
                "Army of the Night": {
                    "income": 14,
                    "gold": 28,
                    "heroes": 2,
                    "controls": [
                        "Barzirak",
                        "The Bjornfoss",
                        "Astridfjord",
                        "Blackstone Fortress",
                        "Adakirk",
                        "Felstoft",
                        "Vilkensinger Fortress",
                        "Barlas on the Lake",
                        "Norstead",
                        "Khorikar"
                    ],
                    "optionalSetup": "Replace one own Control with Razed to receive1 Coven placed at any hostile settlement."
                },
                "Eastern Empire": {
                    "income": 14,
                    "gold": 25,
                    "heroes": 1,
                    "controls": [],
                    "revolt": 2,
                    "setupRules": [
                        "Opening gold may quell revolts."
                    ]
                },
                "Oathborn": {
                    "income": 6,
                    "gold": 28,
                    "heroes": 1,
                    "controls": [
                        "Khorikar",
                        "Belgunot",
                        "Highgarden"
                    ],
                    "setupRules": [
                        "Miners may deploy within2 hexes of an Oathborn settlement."
                    ]
                },
                "Fjordland": {
                    "income": 6,
                    "gold": 25,
                    "heroes": 2,
                    "controls": [
                        "Nordhome",
                        "Seekirk",
                        "Belgunot",
                        "Sunehammer"
                    ],
                    "cannotCollapse": true
                }
            },
            "specialRules": [
                "Publisher suggests one player control both invader kingdoms, since Orcs are close to collapse."
            ],
            "razed": [
                "Gorpin",
                "The Heinburg",
                "Odgervik",
                "Skegheld",
                "Arulud",
                "Mangut",
                "Chanos",
                "Far Tumed",
                "Zarinbar",
                "Fort Gorod",
                "Shaded Vale",
                "Beledi"
            ],
            "razedBoardExcept": {
                "Fields of Ash": [
                    "Placidia",
                    "Muffin Town",
                    "Highbridge",
                    "Southbridge",
                    "Drakenhold"
                ]
            },
            "sourceConflicts": [
                "Khorikar listed as both Night and Oathborn control.",
                "Belgunot listed as both Oathborn and Fjordland control.",
                "Khorikar appears in opening controls for both Army of the Night and Oathborn.",
                "Belgunot appears in opening controls for both Oathborn and Fjordland."
            ],
            "victory": {
                "instant": [
                    {
                        "side": "Resistance",
                        "condition": "Army of the Night collapses"
                    },
                    {
                        "side": "Invader",
                        "condition": "Either Oathborn or Eastern Empire collapses"
                    }
                ],
                "deadline": {
                    "side": "Resistance",
                    "condition": "Orcs have collapsed",
                    "otherwise": "Invader"
                }
            },
            "abandonedLairs": "All Fields of Ash lairs",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms3 seasons and4 boards for this standalone chapter."
            },
            "series": "chronicle",
            "name": "The Lion Rampant"
        },
        {
            "id": "chronicle-10",
            "chapter": 10,
            "book": 3,
            "pages": [
                56,
                57
            ],
            "historicalYear": 598,
            "maps": [
                "Broken Coast",
                "Wildlands",
                "Imperial Heartland",
                "Fields of Ash"
            ],
            "players": 4,
            "turns": 3,
            "start": {
                "year": 1,
                "season": "Spring"
            },
            "end": {
                "year": 1,
                "season": "Autumn"
            },
            "sides": {
                "Invader": [
                    "Army of the Night"
                ],
                "Resistance": [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ]
            },
            "turnOrder": [
                "Fjordland",
                "Army of the Night",
                "Eastern Empire",
                "Oathborn"
            ],
            "study": {
                "glyphs": 4,
                "churns": 2
            },
            "postures": {
                "Invader": {
                    "hostile": [
                        "Neutral",
                        "Assassins Guild",
                        "Mara Mitai"
                    ]
                },
                "Resistance": {
                    "welcoming": [
                        "Neutral"
                    ],
                    "hostile": [
                        "Assassins Guild"
                    ],
                    "allied": [
                        "Mara Mitai"
                    ]
                }
            },
            "deploymentOrder": [
                [
                    "Army of the Night"
                ],
                [
                    "Fjordland",
                    "Oathborn",
                    "Eastern Empire"
                ]
            ],
            "kingdoms": {
                "Army of the Night": {
                    "income": 16,
                    "gold": 25,
                    "heroes": 2,
                    "controls": [
                        "The Bjornfoss",
                        "Adakirk",
                        "Felstoft",
                        "Arulud",
                        "Norstead",
                        "Khorikar",
                        "Barlas on the Lake"
                    ],
                    "fixedHero": "Lilith, Queen of the Night",
                    "randomHeroes": 1
                },
                "Eastern Empire": {
                    "income": 14,
                    "gold": 25,
                    "heroes": 1,
                    "controls": [],
                    "revolt": 3,
                    "setupRules": [
                        "Opening gold may quell revolts."
                    ]
                },
                "Oathborn": {
                    "income": 10,
                    "gold": 25,
                    "heroes": 1,
                    "controls": [
                        "Khorikar",
                        "Belgunot",
                        "Highgarden"
                    ],
                    "setupRules": [
                        "Miners may deploy within2 hexes of an Oathborn settlement."
                    ]
                },
                "Fjordland": {
                    "income": 9,
                    "gold": 25,
                    "heroes": 1,
                    "controls": [
                        "Nordhome",
                        "Seekirk",
                        "Belgunot",
                        "Sunehammer",
                        "Astridfjord",
                        "Odgervik",
                        "Vilkensinger Fortress",
                        "Rjukkenheld"
                    ],
                    "cannotCollapse": true
                }
            },
            "specialRules": [],
            "razed": [
                "Gorpin",
                "The Heinburg",
                "Skegheld",
                "Chanos",
                "Far Tumed",
                "Zarinbar",
                "Fort Gorod",
                "Shaded Vale"
            ],
            "razedBoardExcept": {
                "Fields of Ash": [
                    "Placidia",
                    "Zawikosa",
                    "Highbridge",
                    "Southbridge",
                    "Drakenhold"
                ]
            },
            "sourceConflicts": [
                "Khorikar listed as both Night and Oathborn control.",
                "Belgunot listed as both Oathborn and Fjordland control.",
                "Khorikar appears in opening controls for both Army of the Night and Oathborn.",
                "Belgunot appears in opening controls for both Oathborn and Fjordland."
            ],
            "options": {
                "bitterEnd": {
                    "start": {
                        "year": 1,
                        "season": "Spring"
                    },
                    "end": {
                        "year": 3,
                        "season": "Summer"
                    },
                    "printedTurns": 9,
                    "computedSeasons": 8,
                    "dateConflict": "Printed9 turns disagree with Spring598–Summer600 and page36 maximum35 seasons.",
                    "victory": "Army of the Night wins if it has not collapsed by the deadline.",
                    "specialRules": [
                        "Reserve Osterloch on Night kingdom board during setup. In Winter598 place face-up at Spire of the Moon, moving any current unit to an adjacent hex. Treat Osterloch there as Night-controlled Fragile army, not a Monster. He cannot leave except by elimination. Night cannot enter or build at the Spire while he occupies it; adjacent built Night units enter Prepared."
                    ]
                }
            },
            "victory": {
                "instant": [
                    {
                        "side": "Resistance",
                        "condition": "Army of the Night collapses"
                    }
                ],
                "deadline": {
                    "side": "Invader",
                    "condition": "At least3 Night Control markers remain on map",
                    "otherwise": "Resistance"
                }
            },
            "abandonedLairs": "All Fields of Ash lairs",
            "crosschecks": {
                "campaignsAtAGlanceV4": "User-supplied English overview confirms3 seasons and4 boards for this standalone chapter."
            },
            "series": "chronicle",
            "name": "Twilight of a Goddess"
        }
    ],
    "physicalInventory": {
        "controls": {
            "Army of the Night": 10,
            "Oathborn": 10,
            "Fjordland": 10,
            "Eastern Empire": 10,
            "Goblins": 12,
            "Orcs": 12
        },
        "monsterCommandMarkersEachKingdom": 3,
        "source": "Photograph of complete printed Countersheet6 front; visually counted independently by two reviewers. Countersheet7 contains remaining general markers and coins.",
        "sourceArticleUrl": "https://strategeek.net/2024/05/03/ouverture-burning-banners-compass-games/",
        "sourceImageUrl": "https://strategeek.net/wp-content/uploads/2024/05/img_0956.jpeg",
        "sourceImageSha256": "466b89db18689c4022476e62beb02043b511b4c0c87890c6b3ee69fa12390d15",
        "rule": "Control supplies are finite. A campaign-specific cap replaces the default for that kingdom."
    }
};
