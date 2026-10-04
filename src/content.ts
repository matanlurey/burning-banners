/** Source-derived Wildlands geometry and 44 printed Army definitions.
 * Bitmap sources remain in research scratch, not public assets.
 * The playable teaching fixture is explicitly ORIGINAL. No claim that the
 * incomplete road/river topology or fixture is an official scenario.
 */
import type { Hex, UnitDefinition, ScenarioDefinition } from './engine';

export const worldHexes: Hex[] = [
  {
    "id": "w-0-0",
    "q": 0,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-0-1",
    "q": 0,
    "r": 1,
    "terrain": "mountain"
  },
  {
    "id": "w-0-2",
    "q": 0,
    "r": 2,
    "terrain": "mountain"
  },
  {
    "id": "w-0-3",
    "q": 0,
    "r": 3,
    "terrain": "mountain"
  },
  {
    "id": "w-0-4",
    "q": 0,
    "r": 4,
    "terrain": "clear"
  },
  {
    "id": "w-0-5",
    "q": 0,
    "r": 5,
    "terrain": "clear"
  },
  {
    "id": "w-0-6",
    "q": 0,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-0-7",
    "q": 0,
    "r": 7,
    "terrain": "swamp"
  },
  {
    "id": "w-0-8",
    "q": 0,
    "r": 8,
    "terrain": "lair",
    "coastal": true,
    "edges": {
      "w-0-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-0-9",
    "q": 0,
    "r": 9,
    "terrain": "sea",
    "edges": {
      "w-0-8": {
        "coastal": true
      },
      "w-1-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-0-10",
    "q": 0,
    "r": 10,
    "terrain": "sea",
    "edges": {
      "w-0-11": {
        "coastal": true
      },
      "w-1-9": {
        "coastal": true
      },
      "w-1-10": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-0-11",
    "q": 0,
    "r": 11,
    "terrain": "forest",
    "coastal": true,
    "edges": {
      "w-0-10": {
        "coastal": true
      },
      "w-1-10": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-0-12",
    "q": 0,
    "r": 12,
    "terrain": "clear"
  },
  {
    "id": "w-0-13",
    "q": 0,
    "r": 13,
    "terrain": "mountain"
  },
  {
    "id": "w-0-14",
    "q": 0,
    "r": 14,
    "terrain": "clear"
  },
  {
    "id": "w-0-15",
    "q": 0,
    "r": 15,
    "terrain": "forest"
  },
  {
    "id": "w-1-0",
    "q": 1,
    "r": 0,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-1-1",
    "q": 1,
    "r": 1,
    "terrain": "mountain"
  },
  {
    "id": "w-1-2",
    "q": 1,
    "r": 2,
    "terrain": "mountain"
  },
  {
    "id": "w-1-3",
    "q": 1,
    "r": 3,
    "terrain": "clear"
  },
  {
    "id": "w-1-4",
    "q": 1,
    "r": 4,
    "terrain": "clear",
    "settlement": {
      "name": "Dwelfholm",
      "loyalty": "oathborn",
      "city": true,
      "fortified": 2,
      "port": false
    },
    "edges": {
      "w-2-5": {
        "road": true
      }
    }
  },
  {
    "id": "w-1-5",
    "q": 1,
    "r": 5,
    "terrain": "clear"
  },
  {
    "id": "w-1-6",
    "q": 1,
    "r": 6,
    "terrain": "clear",
    "settlement": {
      "name": "Khorikar",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": true
    }
  },
  {
    "id": "w-1-7",
    "q": 1,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-1-8",
    "q": 1,
    "r": 8,
    "terrain": "forest"
  },
  {
    "id": "w-1-9",
    "q": 1,
    "r": 9,
    "terrain": "forest",
    "coastal": true,
    "edges": {
      "w-0-9": {
        "coastal": true
      },
      "w-0-10": {
        "coastal": true
      },
      "w-1-10": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-1-10",
    "q": 1,
    "r": 10,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-0-10": {
        "coastal": true
      },
      "w-0-11": {
        "coastal": true
      },
      "w-1-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-1-11",
    "q": 1,
    "r": 11,
    "terrain": "clear"
  },
  {
    "id": "w-1-12",
    "q": 1,
    "r": 12,
    "terrain": "clear"
  },
  {
    "id": "w-1-13",
    "q": 1,
    "r": 13,
    "terrain": "lair"
  },
  {
    "id": "w-1-14",
    "q": 1,
    "r": 14,
    "terrain": "clear"
  },
  {
    "id": "w-2-0",
    "q": 2,
    "r": -1,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-2-1",
    "q": 2,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-2-2",
    "q": 2,
    "r": 1,
    "terrain": "mountain",
    "mine": true
  },
  {
    "id": "w-2-3",
    "q": 2,
    "r": 2,
    "terrain": "mountain"
  },
  {
    "id": "w-2-4",
    "q": 2,
    "r": 3,
    "terrain": "clear"
  },
  {
    "id": "w-2-5",
    "q": 2,
    "r": 4,
    "terrain": "clear",
    "edges": {
      "w-1-4": {
        "road": true
      },
      "w-3-5": {
        "road": true
      }
    }
  },
  {
    "id": "w-2-6",
    "q": 2,
    "r": 5,
    "terrain": "clear"
  },
  {
    "id": "w-2-7",
    "q": 2,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-2-8",
    "q": 2,
    "r": 7,
    "terrain": "clear",
    "settlement": {
      "name": "Norstead",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": false
    }
  },
  {
    "id": "w-2-9",
    "q": 2,
    "r": 8,
    "terrain": "forest"
  },
  {
    "id": "w-2-10",
    "q": 2,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-2-11",
    "q": 2,
    "r": 10,
    "terrain": "clear"
  },
  {
    "id": "w-2-12",
    "q": 2,
    "r": 11,
    "terrain": "forest",
    "coastal": true,
    "edges": {
      "w-3-11": {
        "coastal": true
      },
      "w-2-13": {
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-2-13",
    "q": 2,
    "r": 12,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-3-13": {
        "coastal": true
      },
      "w-2-12": {
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-2-14",
    "q": 2,
    "r": 13,
    "terrain": "clear"
  },
  {
    "id": "w-2-15",
    "q": 2,
    "r": 14,
    "terrain": "clear"
  },
  {
    "id": "w-3-0",
    "q": 3,
    "r": -1,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-3-1",
    "q": 3,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-3-2",
    "q": 3,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-3-3",
    "q": 3,
    "r": 2,
    "terrain": "clear"
  },
  {
    "id": "w-3-4",
    "q": 3,
    "r": 3,
    "terrain": "clear"
  },
  {
    "id": "w-3-5",
    "q": 3,
    "r": 4,
    "terrain": "clear",
    "edges": {
      "w-2-5": {
        "road": true
      },
      "w-4-5": {
        "road": true
      }
    }
  },
  {
    "id": "w-3-6",
    "q": 3,
    "r": 5,
    "terrain": "clear"
  },
  {
    "id": "w-3-7",
    "q": 3,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-3-8",
    "q": 3,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-3-9",
    "q": 3,
    "r": 8,
    "terrain": "lair"
  },
  {
    "id": "w-3-10",
    "q": 3,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-3-11",
    "q": 3,
    "r": 10,
    "terrain": "forest",
    "coastal": true,
    "edges": {
      "w-2-12": {
        "coastal": true
      },
      "w-4-12": {
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-3-12",
    "q": 3,
    "r": 11,
    "terrain": "sea",
    "edges": {
      "w-2-12": {
        "coastal": true
      },
      "w-2-13": {
        "coastal": true
      },
      "w-3-11": {
        "coastal": true
      },
      "w-3-13": {
        "coastal": true
      },
      "w-4-12": {
        "coastal": true
      },
      "w-4-13": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-3-13",
    "q": 3,
    "r": 12,
    "terrain": "clear",
    "coastal": true,
    "settlement": {
      "name": "Barlas on the Lake",
      "loyalty": "fjordland",
      "city": false,
      "fortified": 0,
      "port": false
    },
    "edges": {
      "w-4-13": {
        "road": true,
        "coastal": true
      },
      "w-2-13": {
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-3-14",
    "q": 3,
    "r": 13,
    "terrain": "clear"
  },
  {
    "id": "w-4-0",
    "q": 4,
    "r": -2,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-4-1",
    "q": 4,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-4-2",
    "q": 4,
    "r": 0,
    "terrain": "lair"
  },
  {
    "id": "w-4-3",
    "q": 4,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-4-4",
    "q": 4,
    "r": 2,
    "terrain": "clear"
  },
  {
    "id": "w-4-5",
    "q": 4,
    "r": 3,
    "terrain": "clear",
    "edges": {
      "w-3-5": {
        "road": true
      },
      "w-5-5": {
        "road": true
      }
    }
  },
  {
    "id": "w-4-6",
    "q": 4,
    "r": 4,
    "terrain": "clear"
  },
  {
    "id": "w-4-7",
    "q": 4,
    "r": 5,
    "terrain": "mountain"
  },
  {
    "id": "w-4-8",
    "q": 4,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-4-9",
    "q": 4,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-4-10",
    "q": 4,
    "r": 8,
    "terrain": "clear"
  },
  {
    "id": "w-4-11",
    "q": 4,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-4-12",
    "q": 4,
    "r": 10,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-4-13": {
        "road": true,
        "coastal": true
      },
      "w-5-11": {
        "road": true
      },
      "w-3-11": {
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-4-13",
    "q": 4,
    "r": 11,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-3-13": {
        "road": true,
        "coastal": true
      },
      "w-4-12": {
        "road": true,
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-4-14",
    "q": 4,
    "r": 12,
    "terrain": "mountain"
  },
  {
    "id": "w-4-15",
    "q": 4,
    "r": 13,
    "terrain": "mountain"
  },
  {
    "id": "w-5-0",
    "q": 5,
    "r": -2,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-5-1",
    "q": 5,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-5-2",
    "q": 5,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-5-3",
    "q": 5,
    "r": 1,
    "terrain": "clear",
    "settlement": {
      "name": "Tagathol",
      "loyalty": "oathborn",
      "city": false,
      "fortified": 1,
      "port": false
    },
    "edges": {
      "w-5-4": {
        "road": true
      },
      "w-6-3": {
        "road": true
      }
    }
  },
  {
    "id": "w-5-4",
    "q": 5,
    "r": 2,
    "terrain": "clear",
    "edges": {
      "w-5-3": {
        "road": true
      },
      "w-5-5": {
        "road": true
      }
    }
  },
  {
    "id": "w-5-5",
    "q": 5,
    "r": 3,
    "terrain": "clear",
    "settlement": {
      "name": "Arulud",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": false
    },
    "edges": {
      "w-4-5": {
        "road": true
      },
      "w-5-4": {
        "road": true
      },
      "w-6-6": {
        "road": true
      }
    }
  },
  {
    "id": "w-5-6",
    "q": 5,
    "r": 4,
    "terrain": "clear"
  },
  {
    "id": "w-5-7",
    "q": 5,
    "r": 5,
    "terrain": "mountain",
    "settlement": {
      "name": "Spire of the Moon",
      "loyalty": "night",
      "city": true,
      "fortified": 2,
      "port": false,
      "wilderness": "mountain"
    }
  },
  {
    "id": "w-5-8",
    "q": 5,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-5-9",
    "q": 5,
    "r": 7,
    "terrain": "clear",
    "settlement": {
      "name": "Far Tumed",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": false
    }
  },
  {
    "id": "w-5-10",
    "q": 5,
    "r": 8,
    "terrain": "clear"
  },
  {
    "id": "w-5-11",
    "q": 5,
    "r": 9,
    "terrain": "clear",
    "settlement": {
      "name": "Zarinbar",
      "loyalty": "oathborn",
      "city": false,
      "fortified": 0,
      "port": false
    },
    "edges": {
      "w-6-11": {
        "road": true
      },
      "w-4-12": {
        "road": true
      }
    }
  },
  {
    "id": "w-5-12",
    "q": 5,
    "r": 10,
    "terrain": "clear"
  },
  {
    "id": "w-5-13",
    "q": 5,
    "r": 11,
    "terrain": "mountain"
  },
  {
    "id": "w-5-14",
    "q": 5,
    "r": 12,
    "terrain": "mountain",
    "mine": true
  },
  {
    "id": "w-6-0",
    "q": 6,
    "r": -3,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-6-1",
    "q": 6,
    "r": -2,
    "terrain": "mountain"
  },
  {
    "id": "w-6-2",
    "q": 6,
    "r": -1,
    "terrain": "mountain"
  },
  {
    "id": "w-6-3",
    "q": 6,
    "r": 0,
    "terrain": "mountain",
    "mine": true,
    "edges": {
      "w-5-3": {
        "road": true
      },
      "w-7-3": {
        "road": true
      }
    }
  },
  {
    "id": "w-6-4",
    "q": 6,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-6-5",
    "q": 6,
    "r": 2,
    "terrain": "clear"
  },
  {
    "id": "w-6-6",
    "q": 6,
    "r": 3,
    "terrain": "clear",
    "edges": {
      "w-5-5": {
        "road": true
      },
      "w-7-6": {
        "road": true
      }
    }
  },
  {
    "id": "w-6-7",
    "q": 6,
    "r": 4,
    "terrain": "clear"
  },
  {
    "id": "w-6-8",
    "q": 6,
    "r": 5,
    "terrain": "clear"
  },
  {
    "id": "w-6-9",
    "q": 6,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-6-10",
    "q": 6,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-6-11",
    "q": 6,
    "r": 8,
    "terrain": "clear",
    "edges": {
      "w-5-11": {
        "road": true
      },
      "w-7-11": {
        "road": true
      }
    }
  },
  {
    "id": "w-6-12",
    "q": 6,
    "r": 9,
    "terrain": "mountain"
  },
  {
    "id": "w-6-13",
    "q": 6,
    "r": 10,
    "terrain": "mountain"
  },
  {
    "id": "w-6-14",
    "q": 6,
    "r": 11,
    "terrain": "mountain"
  },
  {
    "id": "w-6-15",
    "q": 6,
    "r": 12,
    "terrain": "clear"
  },
  {
    "id": "w-7-0",
    "q": 7,
    "r": -3,
    "terrain": "mountain",
    "entry": "goblins"
  },
  {
    "id": "w-7-1",
    "q": 7,
    "r": -2,
    "terrain": "mountain"
  },
  {
    "id": "w-7-2",
    "q": 7,
    "r": -1,
    "terrain": "mountain"
  },
  {
    "id": "w-7-3",
    "q": 7,
    "r": 0,
    "terrain": "clear",
    "edges": {
      "w-6-3": {
        "road": true
      },
      "w-8-3": {
        "road": true
      }
    }
  },
  {
    "id": "w-7-4",
    "q": 7,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-7-5",
    "q": 7,
    "r": 2,
    "terrain": "clear"
  },
  {
    "id": "w-7-6",
    "q": 7,
    "r": 3,
    "terrain": "clear",
    "edges": {
      "w-6-6": {
        "road": true
      },
      "w-7-7": {
        "road": true
      }
    }
  },
  {
    "id": "w-7-7",
    "q": 7,
    "r": 4,
    "terrain": "clear",
    "coastal": true,
    "settlement": {
      "name": "Mangut",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": true
    },
    "edges": {
      "w-7-6": {
        "road": true
      },
      "w-7-8": {
        "road": true
      },
      "w-8-7": {
        "coastal": true
      },
      "w-8-8": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-7-8",
    "q": 7,
    "r": 5,
    "terrain": "clear",
    "edges": {
      "w-7-7": {
        "road": true
      },
      "w-8-9": {
        "road": true
      }
    }
  },
  {
    "id": "w-7-9",
    "q": 7,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-7-10",
    "q": 7,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-7-11",
    "q": 7,
    "r": 8,
    "terrain": "clear",
    "edges": {
      "w-6-11": {
        "road": true
      },
      "w-8-12": {
        "road": true
      }
    }
  },
  {
    "id": "w-7-12",
    "q": 7,
    "r": 9,
    "terrain": "mountain",
    "mine": true,
    "edges": {
      "w-8-12": {
        "road": true,
        "river": 1
      },
      "w-8-13": {
        "river": 1
      }
    }
  },
  {
    "id": "w-7-13",
    "q": 7,
    "r": 10,
    "terrain": "mountain",
    "edges": {
      "w-8-13": {
        "river": 1
      },
      "w-8-14": {
        "river": 1
      }
    }
  },
  {
    "id": "w-7-14",
    "q": 7,
    "r": 11,
    "terrain": "clear",
    "edges": {
      "w-8-14": {
        "river": 1
      }
    }
  },
  {
    "id": "w-8-0",
    "q": 8,
    "r": -4,
    "terrain": "mountain"
  },
  {
    "id": "w-8-1",
    "q": 8,
    "r": -3,
    "terrain": "clear"
  },
  {
    "id": "w-8-2",
    "q": 8,
    "r": -2,
    "terrain": "clear"
  },
  {
    "id": "w-8-3",
    "q": 8,
    "r": -1,
    "terrain": "clear",
    "settlement": {
      "name": "Nal Narag",
      "loyalty": "oathborn",
      "city": false,
      "fortified": 0,
      "port": true,
      "wilderness": "mountain"
    },
    "edges": {
      "w-7-3": {
        "road": true
      }
    }
  },
  {
    "id": "w-8-4",
    "q": 8,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-8-5",
    "q": 8,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-8-6",
    "q": 8,
    "r": 2,
    "terrain": "lair"
  },
  {
    "id": "w-8-7",
    "q": 8,
    "r": 3,
    "terrain": "swamp",
    "coastal": true,
    "edges": {
      "w-7-7": {
        "coastal": true
      },
      "w-8-8": {
        "coastal": true
      },
      "w-9-6": {
        "coastal": true
      },
      "w-9-7": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-8-8",
    "q": 8,
    "r": 4,
    "terrain": "sea",
    "edges": {
      "w-7-7": {
        "coastal": true
      },
      "w-8-7": {
        "coastal": true
      },
      "w-8-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-8-9",
    "q": 8,
    "r": 5,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-7-8": {
        "road": true
      },
      "w-9-9": {
        "road": true,
        "coastal": true
      },
      "w-8-8": {
        "coastal": true
      },
      "w-9-8": {
        "coastal": true
      },
      "w-8-10": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-8-10",
    "q": 8,
    "r": 6,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-9-9": {
        "road": true,
        "coastal": true
      },
      "w-8-11": {
        "road": true,
        "coastal": true
      },
      "w-8-9": {
        "coastal": true
      },
      "w-9-10": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-8-11",
    "q": 8,
    "r": 7,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-8-10": {
        "road": true,
        "coastal": true
      },
      "w-8-12": {
        "road": true
      },
      "w-9-10": {
        "coastal": true
      },
      "w-9-11": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-8-12",
    "q": 8,
    "r": 8,
    "terrain": "clear",
    "edges": {
      "w-8-11": {
        "road": true
      },
      "w-7-11": {
        "road": true
      },
      "w-7-12": {
        "road": true,
        "river": 1
      },
      "w-8-13": {
        "road": true
      }
    }
  },
  {
    "id": "w-8-13",
    "q": 8,
    "r": 9,
    "terrain": "clear",
    "edges": {
      "w-8-12": {
        "road": true
      },
      "w-8-14": {
        "road": true
      },
      "w-7-13": {
        "river": 1
      },
      "w-7-12": {
        "river": 1
      }
    }
  },
  {
    "id": "w-8-14",
    "q": 8,
    "r": 10,
    "terrain": "clear",
    "settlement": {
      "name": "Shaded Vale",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": false
    },
    "edges": {
      "w-8-13": {
        "road": true
      },
      "w-7-14": {
        "river": 1
      },
      "w-7-13": {
        "river": 1
      }
    }
  },
  {
    "id": "w-8-15",
    "q": 8,
    "r": 11,
    "terrain": "clear"
  },
  {
    "id": "w-9-0",
    "q": 9,
    "r": -4,
    "terrain": "mountain"
  },
  {
    "id": "w-9-1",
    "q": 9,
    "r": -3,
    "terrain": "clear"
  },
  {
    "id": "w-9-2",
    "q": 9,
    "r": -2,
    "terrain": "clear"
  },
  {
    "id": "w-9-3",
    "q": 9,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-9-4",
    "q": 9,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-9-5",
    "q": 9,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-9-6",
    "q": 9,
    "r": 2,
    "terrain": "swamp",
    "coastal": true,
    "edges": {
      "w-8-7": {
        "coastal": true
      },
      "w-9-7": {
        "coastal": true
      },
      "w-10-7": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-9-7",
    "q": 9,
    "r": 3,
    "terrain": "sea",
    "edges": {
      "w-8-7": {
        "coastal": true
      },
      "w-9-6": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-9-8",
    "q": 9,
    "r": 4,
    "terrain": "sea",
    "edges": {
      "w-8-9": {
        "coastal": true
      },
      "w-9-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-9-9",
    "q": 9,
    "r": 5,
    "terrain": "clear",
    "coastal": true,
    "settlement": {
      "name": "Chanos",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": false
    },
    "edges": {
      "w-8-9": {
        "road": true,
        "coastal": true
      },
      "w-8-10": {
        "road": true,
        "coastal": true
      },
      "w-9-8": {
        "coastal": true
      },
      "w-9-10": {
        "coastal": true
      },
      "w-10-9": {
        "coastal": true
      },
      "w-10-10": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-9-10",
    "q": 9,
    "r": 6,
    "terrain": "sea",
    "edges": {
      "w-8-10": {
        "coastal": true
      },
      "w-8-11": {
        "coastal": true
      },
      "w-9-9": {
        "coastal": true
      },
      "w-9-11": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-9-11",
    "q": 9,
    "r": 7,
    "terrain": "clear",
    "coastal": true,
    "settlement": {
      "name": "Fort Gorod",
      "loyalty": null,
      "city": false,
      "fortified": 1,
      "port": true
    },
    "edges": {
      "w-8-11": {
        "coastal": true
      },
      "w-9-10": {
        "coastal": true
      },
      "w-10-11": {
        "coastal": true
      },
      "w-10-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-9-12",
    "q": 9,
    "r": 8,
    "terrain": "clear"
  },
  {
    "id": "w-9-13",
    "q": 9,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-9-14",
    "q": 9,
    "r": 10,
    "terrain": "clear"
  },
  {
    "id": "w-10-0",
    "q": 10,
    "r": -5,
    "terrain": "mountain"
  },
  {
    "id": "w-10-1",
    "q": 10,
    "r": -4,
    "terrain": "clear"
  },
  {
    "id": "w-10-2",
    "q": 10,
    "r": -3,
    "terrain": "clear"
  },
  {
    "id": "w-10-3",
    "q": 10,
    "r": -2,
    "terrain": "clear"
  },
  {
    "id": "w-10-4",
    "q": 10,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-10-5",
    "q": 10,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-10-6",
    "q": 10,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-10-7",
    "q": 10,
    "r": 2,
    "terrain": "sea",
    "edges": {
      "w-9-6": {
        "coastal": true
      },
      "w-11-6": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-10-8",
    "q": 10,
    "r": 3,
    "terrain": "sea"
  },
  {
    "id": "w-10-9",
    "q": 10,
    "r": 4,
    "terrain": "sea",
    "edges": {
      "w-9-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-10-10",
    "q": 10,
    "r": 5,
    "terrain": "sea",
    "edges": {
      "w-9-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-10-11",
    "q": 10,
    "r": 6,
    "terrain": "sea",
    "edges": {
      "w-9-11": {
        "coastal": true
      },
      "w-10-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-10-12",
    "q": 10,
    "r": 7,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-10-11": {
        "coastal": true
      },
      "w-9-11": {
        "coastal": true
      },
      "w-11-11": {
        "coastal": true
      },
      "w-11-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-10-13",
    "q": 10,
    "r": 8,
    "terrain": "lair"
  },
  {
    "id": "w-10-14",
    "q": 10,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-10-15",
    "q": 10,
    "r": 10,
    "terrain": "clear"
  },
  {
    "id": "w-11-0",
    "q": 11,
    "r": -5,
    "terrain": "mountain"
  },
  {
    "id": "w-11-1",
    "q": 11,
    "r": -4,
    "terrain": "mountain",
    "mine": true
  },
  {
    "id": "w-11-2",
    "q": 11,
    "r": -3,
    "terrain": "mountain"
  },
  {
    "id": "w-11-3",
    "q": 11,
    "r": -2,
    "terrain": "mountain"
  },
  {
    "id": "w-11-4",
    "q": 11,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-11-5",
    "q": 11,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-11-6",
    "q": 11,
    "r": 1,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-10-7": {
        "coastal": true
      },
      "w-11-7": {
        "coastal": true
      },
      "w-12-7": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-11-7",
    "q": 11,
    "r": 2,
    "terrain": "sea",
    "edges": {
      "w-11-6": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-11-8",
    "q": 11,
    "r": 3,
    "terrain": "sea"
  },
  {
    "id": "w-11-9",
    "q": 11,
    "r": 4,
    "terrain": "lair"
  },
  {
    "id": "w-11-10",
    "q": 11,
    "r": 5,
    "terrain": "sea"
  },
  {
    "id": "w-11-11",
    "q": 11,
    "r": 6,
    "terrain": "sea",
    "edges": {
      "w-10-12": {
        "coastal": true
      },
      "w-11-12": {
        "coastal": true
      },
      "w-12-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-11-12",
    "q": 11,
    "r": 7,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-10-12": {
        "coastal": true
      },
      "w-11-11": {
        "coastal": true
      },
      "w-12-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-11-13",
    "q": 11,
    "r": 8,
    "terrain": "clear"
  },
  {
    "id": "w-11-14",
    "q": 11,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-12-0",
    "q": 12,
    "r": -6,
    "terrain": "mountain"
  },
  {
    "id": "w-12-1",
    "q": 12,
    "r": -5,
    "terrain": "mountain"
  },
  {
    "id": "w-12-2",
    "q": 12,
    "r": -4,
    "terrain": "mountain"
  },
  {
    "id": "w-12-3",
    "q": 12,
    "r": -3,
    "terrain": "mountain"
  },
  {
    "id": "w-12-4",
    "q": 12,
    "r": -2,
    "terrain": "clear"
  },
  {
    "id": "w-12-5",
    "q": 12,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-12-6",
    "q": 12,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-12-7",
    "q": 12,
    "r": 1,
    "terrain": "sea",
    "edges": {
      "w-11-6": {
        "coastal": true
      },
      "w-13-6": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-12-8",
    "q": 12,
    "r": 2,
    "terrain": "sea"
  },
  {
    "id": "w-12-9",
    "q": 12,
    "r": 3,
    "terrain": "sea"
  },
  {
    "id": "w-12-10",
    "q": 12,
    "r": 4,
    "terrain": "sea"
  },
  {
    "id": "w-12-11",
    "q": 12,
    "r": 5,
    "terrain": "sea",
    "edges": {
      "w-12-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-12-12",
    "q": 12,
    "r": 6,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-11-11": {
        "coastal": true
      },
      "w-11-12": {
        "coastal": true
      },
      "w-12-11": {
        "coastal": true
      },
      "w-13-11": {
        "coastal": true
      },
      "w-13-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-12-13",
    "q": 12,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-12-14",
    "q": 12,
    "r": 8,
    "terrain": "clear"
  },
  {
    "id": "w-12-15",
    "q": 12,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-13-0",
    "q": 13,
    "r": -6,
    "terrain": "mountain"
  },
  {
    "id": "w-13-1",
    "q": 13,
    "r": -5,
    "terrain": "mountain"
  },
  {
    "id": "w-13-2",
    "q": 13,
    "r": -4,
    "terrain": "mountain"
  },
  {
    "id": "w-13-3",
    "q": 13,
    "r": -3,
    "terrain": "mountain"
  },
  {
    "id": "w-13-4",
    "q": 13,
    "r": -2,
    "terrain": "clear"
  },
  {
    "id": "w-13-5",
    "q": 13,
    "r": -1,
    "terrain": "clear",
    "entry": "orcs"
  },
  {
    "id": "w-13-6",
    "q": 13,
    "r": 0,
    "terrain": "clear",
    "coastal": true,
    "entry": "orcs",
    "edges": {
      "w-12-7": {
        "coastal": true
      },
      "w-13-7": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-13-7",
    "q": 13,
    "r": 1,
    "terrain": "sea",
    "entry": "orcs",
    "edges": {
      "w-13-6": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-13-8",
    "q": 13,
    "r": 2,
    "terrain": "sea",
    "entry": "orcs"
  },
  {
    "id": "w-13-9",
    "q": 13,
    "r": 3,
    "terrain": "sea",
    "entry": "orcs"
  },
  {
    "id": "w-13-10",
    "q": 13,
    "r": 4,
    "terrain": "sea",
    "entry": "orcs"
  },
  {
    "id": "w-13-11",
    "q": 13,
    "r": 5,
    "terrain": "sea",
    "entry": "orcs",
    "edges": {
      "w-12-12": {
        "coastal": true
      },
      "w-13-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-13-12",
    "q": 13,
    "r": 6,
    "terrain": "clear",
    "coastal": true,
    "entry": "orcs",
    "edges": {
      "w-12-12": {
        "coastal": true
      },
      "w-13-11": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-13-13",
    "q": 13,
    "r": 7,
    "terrain": "clear",
    "entry": "orcs"
  },
  {
    "id": "w-13-14",
    "q": 13,
    "r": 8,
    "terrain": "clear",
    "entry": "orcs"
  }
];

export const hexes: Hex[] = [
  {
    "id": "w-0-0",
    "q": 0,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-0-1",
    "q": 0,
    "r": 1,
    "terrain": "mountain"
  },
  {
    "id": "w-0-2",
    "q": 0,
    "r": 2,
    "terrain": "mountain"
  },
  {
    "id": "w-0-3",
    "q": 0,
    "r": 3,
    "terrain": "mountain"
  },
  {
    "id": "w-0-4",
    "q": 0,
    "r": 4,
    "terrain": "clear"
  },
  {
    "id": "w-0-5",
    "q": 0,
    "r": 5,
    "terrain": "clear"
  },
  {
    "id": "w-0-6",
    "q": 0,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-0-7",
    "q": 0,
    "r": 7,
    "terrain": "swamp"
  },
  {
    "id": "w-0-8",
    "q": 0,
    "r": 8,
    "terrain": "lair",
    "coastal": true,
    "edges": {
      "w-0-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-0-9",
    "q": 0,
    "r": 9,
    "terrain": "sea",
    "edges": {
      "w-0-8": {
        "coastal": true
      },
      "w-1-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-0-10",
    "q": 0,
    "r": 10,
    "terrain": "sea",
    "edges": {
      "w-0-11": {
        "coastal": true
      },
      "w-1-9": {
        "coastal": true
      },
      "w-1-10": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-0-11",
    "q": 0,
    "r": 11,
    "terrain": "forest",
    "coastal": true,
    "edges": {
      "w-0-10": {
        "coastal": true
      },
      "w-1-10": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-0-12",
    "q": 0,
    "r": 12,
    "terrain": "clear"
  },
  {
    "id": "w-0-13",
    "q": 0,
    "r": 13,
    "terrain": "mountain"
  },
  {
    "id": "w-0-14",
    "q": 0,
    "r": 14,
    "terrain": "clear"
  },
  {
    "id": "w-0-15",
    "q": 0,
    "r": 15,
    "terrain": "forest"
  },
  {
    "id": "w-1-0",
    "q": 1,
    "r": 0,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-1-1",
    "q": 1,
    "r": 1,
    "terrain": "mountain"
  },
  {
    "id": "w-1-2",
    "q": 1,
    "r": 2,
    "terrain": "mountain"
  },
  {
    "id": "w-1-3",
    "q": 1,
    "r": 3,
    "terrain": "clear"
  },
  {
    "id": "w-1-4",
    "q": 1,
    "r": 4,
    "terrain": "clear",
    "settlement": {
      "name": "Dwelfholm",
      "loyalty": "oathborn",
      "city": true,
      "fortified": 2,
      "port": false
    },
    "edges": {
      "w-2-5": {
        "road": true
      }
    },
    "prohibited": true
  },
  {
    "id": "w-1-5",
    "q": 1,
    "r": 5,
    "terrain": "clear"
  },
  {
    "id": "w-1-6",
    "q": 1,
    "r": 6,
    "terrain": "clear",
    "settlement": {
      "name": "Khorikar",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": true
    },
    "prohibited": true
  },
  {
    "id": "w-1-7",
    "q": 1,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-1-8",
    "q": 1,
    "r": 8,
    "terrain": "forest"
  },
  {
    "id": "w-1-9",
    "q": 1,
    "r": 9,
    "terrain": "forest",
    "coastal": true,
    "edges": {
      "w-0-9": {
        "coastal": true
      },
      "w-0-10": {
        "coastal": true
      },
      "w-1-10": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-1-10",
    "q": 1,
    "r": 10,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-0-10": {
        "coastal": true
      },
      "w-0-11": {
        "coastal": true
      },
      "w-1-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-1-11",
    "q": 1,
    "r": 11,
    "terrain": "clear"
  },
  {
    "id": "w-1-12",
    "q": 1,
    "r": 12,
    "terrain": "clear"
  },
  {
    "id": "w-1-13",
    "q": 1,
    "r": 13,
    "terrain": "lair"
  },
  {
    "id": "w-1-14",
    "q": 1,
    "r": 14,
    "terrain": "clear"
  },
  {
    "id": "w-2-0",
    "q": 2,
    "r": -1,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-2-1",
    "q": 2,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-2-2",
    "q": 2,
    "r": 1,
    "terrain": "mountain",
    "mine": true
  },
  {
    "id": "w-2-3",
    "q": 2,
    "r": 2,
    "terrain": "mountain"
  },
  {
    "id": "w-2-4",
    "q": 2,
    "r": 3,
    "terrain": "clear"
  },
  {
    "id": "w-2-5",
    "q": 2,
    "r": 4,
    "terrain": "clear",
    "edges": {
      "w-1-4": {
        "road": true
      },
      "w-3-5": {
        "road": true
      }
    }
  },
  {
    "id": "w-2-6",
    "q": 2,
    "r": 5,
    "terrain": "clear"
  },
  {
    "id": "w-2-7",
    "q": 2,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-2-8",
    "q": 2,
    "r": 7,
    "terrain": "clear",
    "settlement": {
      "name": "Norstead",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": false
    }
  },
  {
    "id": "w-2-9",
    "q": 2,
    "r": 8,
    "terrain": "forest"
  },
  {
    "id": "w-2-10",
    "q": 2,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-2-11",
    "q": 2,
    "r": 10,
    "terrain": "clear"
  },
  {
    "id": "w-2-12",
    "q": 2,
    "r": 11,
    "terrain": "forest",
    "coastal": true,
    "edges": {
      "w-3-11": {
        "coastal": true
      },
      "w-2-13": {
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-2-13",
    "q": 2,
    "r": 12,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-3-13": {
        "coastal": true
      },
      "w-2-12": {
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-2-14",
    "q": 2,
    "r": 13,
    "terrain": "clear"
  },
  {
    "id": "w-2-15",
    "q": 2,
    "r": 14,
    "terrain": "clear"
  },
  {
    "id": "w-3-0",
    "q": 3,
    "r": -1,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-3-1",
    "q": 3,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-3-2",
    "q": 3,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-3-3",
    "q": 3,
    "r": 2,
    "terrain": "clear"
  },
  {
    "id": "w-3-4",
    "q": 3,
    "r": 3,
    "terrain": "clear"
  },
  {
    "id": "w-3-5",
    "q": 3,
    "r": 4,
    "terrain": "clear",
    "edges": {
      "w-2-5": {
        "road": true
      },
      "w-4-5": {
        "road": true
      }
    }
  },
  {
    "id": "w-3-6",
    "q": 3,
    "r": 5,
    "terrain": "clear"
  },
  {
    "id": "w-3-7",
    "q": 3,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-3-8",
    "q": 3,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-3-9",
    "q": 3,
    "r": 8,
    "terrain": "lair"
  },
  {
    "id": "w-3-10",
    "q": 3,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-3-11",
    "q": 3,
    "r": 10,
    "terrain": "forest",
    "coastal": true,
    "edges": {
      "w-2-12": {
        "coastal": true
      },
      "w-4-12": {
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-3-12",
    "q": 3,
    "r": 11,
    "terrain": "sea",
    "edges": {
      "w-2-12": {
        "coastal": true
      },
      "w-2-13": {
        "coastal": true
      },
      "w-3-11": {
        "coastal": true
      },
      "w-3-13": {
        "coastal": true
      },
      "w-4-12": {
        "coastal": true
      },
      "w-4-13": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-3-13",
    "q": 3,
    "r": 12,
    "terrain": "clear",
    "coastal": true,
    "settlement": {
      "name": "Barlas on the Lake",
      "loyalty": "fjordland",
      "city": false,
      "fortified": 0,
      "port": false
    },
    "edges": {
      "w-4-13": {
        "road": true,
        "coastal": true
      },
      "w-2-13": {
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-3-14",
    "q": 3,
    "r": 13,
    "terrain": "clear"
  },
  {
    "id": "w-4-0",
    "q": 4,
    "r": -2,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-4-1",
    "q": 4,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-4-2",
    "q": 4,
    "r": 0,
    "terrain": "lair"
  },
  {
    "id": "w-4-3",
    "q": 4,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-4-4",
    "q": 4,
    "r": 2,
    "terrain": "clear"
  },
  {
    "id": "w-4-5",
    "q": 4,
    "r": 3,
    "terrain": "clear",
    "edges": {
      "w-3-5": {
        "road": true
      },
      "w-5-5": {
        "road": true
      }
    }
  },
  {
    "id": "w-4-6",
    "q": 4,
    "r": 4,
    "terrain": "clear"
  },
  {
    "id": "w-4-7",
    "q": 4,
    "r": 5,
    "terrain": "mountain"
  },
  {
    "id": "w-4-8",
    "q": 4,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-4-9",
    "q": 4,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-4-10",
    "q": 4,
    "r": 8,
    "terrain": "clear"
  },
  {
    "id": "w-4-11",
    "q": 4,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-4-12",
    "q": 4,
    "r": 10,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-4-13": {
        "road": true,
        "coastal": true
      },
      "w-5-11": {
        "road": true
      },
      "w-3-11": {
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-4-13",
    "q": 4,
    "r": 11,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-3-13": {
        "road": true,
        "coastal": true
      },
      "w-4-12": {
        "road": true,
        "coastal": true
      },
      "w-3-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-4-14",
    "q": 4,
    "r": 12,
    "terrain": "mountain"
  },
  {
    "id": "w-4-15",
    "q": 4,
    "r": 13,
    "terrain": "mountain"
  },
  {
    "id": "w-5-0",
    "q": 5,
    "r": -2,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-5-1",
    "q": 5,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-5-2",
    "q": 5,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-5-3",
    "q": 5,
    "r": 1,
    "terrain": "clear",
    "settlement": {
      "name": "Tagathol",
      "loyalty": "oathborn",
      "city": false,
      "fortified": 1,
      "port": false
    },
    "edges": {
      "w-5-4": {
        "road": true
      },
      "w-6-3": {
        "road": true
      }
    },
    "prohibited": true
  },
  {
    "id": "w-5-4",
    "q": 5,
    "r": 2,
    "terrain": "clear",
    "edges": {
      "w-5-3": {
        "road": true
      },
      "w-5-5": {
        "road": true
      }
    }
  },
  {
    "id": "w-5-5",
    "q": 5,
    "r": 3,
    "terrain": "clear",
    "settlement": {
      "name": "Arulud",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": false
    },
    "edges": {
      "w-4-5": {
        "road": true
      },
      "w-5-4": {
        "road": true
      },
      "w-6-6": {
        "road": true
      }
    },
    "prohibited": true
  },
  {
    "id": "w-5-6",
    "q": 5,
    "r": 4,
    "terrain": "clear"
  },
  {
    "id": "w-5-7",
    "q": 5,
    "r": 5,
    "terrain": "mountain",
    "settlement": {
      "name": "Spire of the Moon",
      "loyalty": "night",
      "city": true,
      "fortified": 2,
      "port": false,
      "wilderness": "mountain"
    },
    "prohibited": true
  },
  {
    "id": "w-5-8",
    "q": 5,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-5-9",
    "q": 5,
    "r": 7,
    "terrain": "clear",
    "settlement": {
      "name": "Far Tumed",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": false
    }
  },
  {
    "id": "w-5-10",
    "q": 5,
    "r": 8,
    "terrain": "clear"
  },
  {
    "id": "w-5-11",
    "q": 5,
    "r": 9,
    "terrain": "clear",
    "settlement": {
      "name": "Zarinbar",
      "loyalty": "oathborn",
      "city": false,
      "fortified": 0,
      "port": false
    },
    "edges": {
      "w-6-11": {
        "road": true
      },
      "w-4-12": {
        "road": true
      }
    }
  },
  {
    "id": "w-5-12",
    "q": 5,
    "r": 10,
    "terrain": "clear"
  },
  {
    "id": "w-5-13",
    "q": 5,
    "r": 11,
    "terrain": "mountain"
  },
  {
    "id": "w-5-14",
    "q": 5,
    "r": 12,
    "terrain": "mountain",
    "mine": true
  },
  {
    "id": "w-6-0",
    "q": 6,
    "r": -3,
    "terrain": "clear",
    "entry": "goblins"
  },
  {
    "id": "w-6-1",
    "q": 6,
    "r": -2,
    "terrain": "mountain"
  },
  {
    "id": "w-6-2",
    "q": 6,
    "r": -1,
    "terrain": "mountain"
  },
  {
    "id": "w-6-3",
    "q": 6,
    "r": 0,
    "terrain": "mountain",
    "mine": true,
    "edges": {
      "w-5-3": {
        "road": true
      },
      "w-7-3": {
        "road": true
      }
    }
  },
  {
    "id": "w-6-4",
    "q": 6,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-6-5",
    "q": 6,
    "r": 2,
    "terrain": "clear"
  },
  {
    "id": "w-6-6",
    "q": 6,
    "r": 3,
    "terrain": "clear",
    "edges": {
      "w-5-5": {
        "road": true
      },
      "w-7-6": {
        "road": true
      }
    }
  },
  {
    "id": "w-6-7",
    "q": 6,
    "r": 4,
    "terrain": "clear"
  },
  {
    "id": "w-6-8",
    "q": 6,
    "r": 5,
    "terrain": "clear"
  },
  {
    "id": "w-6-9",
    "q": 6,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-6-10",
    "q": 6,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-6-11",
    "q": 6,
    "r": 8,
    "terrain": "clear",
    "edges": {
      "w-5-11": {
        "road": true
      },
      "w-7-11": {
        "road": true
      }
    }
  },
  {
    "id": "w-6-12",
    "q": 6,
    "r": 9,
    "terrain": "mountain"
  },
  {
    "id": "w-6-13",
    "q": 6,
    "r": 10,
    "terrain": "mountain"
  },
  {
    "id": "w-6-14",
    "q": 6,
    "r": 11,
    "terrain": "mountain"
  },
  {
    "id": "w-6-15",
    "q": 6,
    "r": 12,
    "terrain": "clear"
  },
  {
    "id": "w-7-0",
    "q": 7,
    "r": -3,
    "terrain": "mountain",
    "entry": "goblins"
  },
  {
    "id": "w-7-1",
    "q": 7,
    "r": -2,
    "terrain": "mountain"
  },
  {
    "id": "w-7-2",
    "q": 7,
    "r": -1,
    "terrain": "mountain"
  },
  {
    "id": "w-7-3",
    "q": 7,
    "r": 0,
    "terrain": "clear",
    "edges": {
      "w-6-3": {
        "road": true
      },
      "w-8-3": {
        "road": true
      }
    }
  },
  {
    "id": "w-7-4",
    "q": 7,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-7-5",
    "q": 7,
    "r": 2,
    "terrain": "clear"
  },
  {
    "id": "w-7-6",
    "q": 7,
    "r": 3,
    "terrain": "clear",
    "edges": {
      "w-6-6": {
        "road": true
      },
      "w-7-7": {
        "road": true
      }
    }
  },
  {
    "id": "w-7-7",
    "q": 7,
    "r": 4,
    "terrain": "clear",
    "coastal": true,
    "settlement": {
      "name": "Mangut",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": true
    },
    "edges": {
      "w-7-6": {
        "road": true
      },
      "w-7-8": {
        "road": true
      },
      "w-8-7": {
        "coastal": true
      },
      "w-8-8": {
        "coastal": true
      }
    },
    "prohibited": true
  },
  {
    "id": "w-7-8",
    "q": 7,
    "r": 5,
    "terrain": "clear",
    "edges": {
      "w-7-7": {
        "road": true
      },
      "w-8-9": {
        "road": true
      }
    }
  },
  {
    "id": "w-7-9",
    "q": 7,
    "r": 6,
    "terrain": "clear"
  },
  {
    "id": "w-7-10",
    "q": 7,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-7-11",
    "q": 7,
    "r": 8,
    "terrain": "clear",
    "edges": {
      "w-6-11": {
        "road": true
      },
      "w-8-12": {
        "road": true
      }
    }
  },
  {
    "id": "w-7-12",
    "q": 7,
    "r": 9,
    "terrain": "mountain",
    "mine": true,
    "edges": {
      "w-8-12": {
        "road": true,
        "river": 1
      },
      "w-8-13": {
        "river": 1
      }
    }
  },
  {
    "id": "w-7-13",
    "q": 7,
    "r": 10,
    "terrain": "mountain",
    "edges": {
      "w-8-13": {
        "river": 1
      },
      "w-8-14": {
        "river": 1
      }
    }
  },
  {
    "id": "w-7-14",
    "q": 7,
    "r": 11,
    "terrain": "clear",
    "edges": {
      "w-8-14": {
        "river": 1
      }
    }
  },
  {
    "id": "w-8-0",
    "q": 8,
    "r": -4,
    "terrain": "mountain"
  },
  {
    "id": "w-8-1",
    "q": 8,
    "r": -3,
    "terrain": "clear"
  },
  {
    "id": "w-8-2",
    "q": 8,
    "r": -2,
    "terrain": "clear"
  },
  {
    "id": "w-8-3",
    "q": 8,
    "r": -1,
    "terrain": "clear",
    "settlement": {
      "name": "Nal Narag",
      "loyalty": "oathborn",
      "city": false,
      "fortified": 0,
      "port": true,
      "wilderness": "mountain"
    },
    "edges": {
      "w-7-3": {
        "road": true
      }
    },
    "prohibited": true
  },
  {
    "id": "w-8-4",
    "q": 8,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-8-5",
    "q": 8,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-8-6",
    "q": 8,
    "r": 2,
    "terrain": "lair"
  },
  {
    "id": "w-8-7",
    "q": 8,
    "r": 3,
    "terrain": "swamp",
    "coastal": true,
    "edges": {
      "w-7-7": {
        "coastal": true
      },
      "w-8-8": {
        "coastal": true
      },
      "w-9-6": {
        "coastal": true
      },
      "w-9-7": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-8-8",
    "q": 8,
    "r": 4,
    "terrain": "sea",
    "edges": {
      "w-7-7": {
        "coastal": true
      },
      "w-8-7": {
        "coastal": true
      },
      "w-8-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-8-9",
    "q": 8,
    "r": 5,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-7-8": {
        "road": true
      },
      "w-9-9": {
        "road": true,
        "coastal": true
      },
      "w-8-8": {
        "coastal": true
      },
      "w-9-8": {
        "coastal": true
      },
      "w-8-10": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-8-10",
    "q": 8,
    "r": 6,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-9-9": {
        "road": true,
        "coastal": true
      },
      "w-8-11": {
        "road": true,
        "coastal": true
      },
      "w-8-9": {
        "coastal": true
      },
      "w-9-10": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-8-11",
    "q": 8,
    "r": 7,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-8-10": {
        "road": true,
        "coastal": true
      },
      "w-8-12": {
        "road": true
      },
      "w-9-10": {
        "coastal": true
      },
      "w-9-11": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-8-12",
    "q": 8,
    "r": 8,
    "terrain": "clear",
    "edges": {
      "w-8-11": {
        "road": true
      },
      "w-7-11": {
        "road": true
      },
      "w-7-12": {
        "road": true,
        "river": 1
      },
      "w-8-13": {
        "road": true
      }
    }
  },
  {
    "id": "w-8-13",
    "q": 8,
    "r": 9,
    "terrain": "clear",
    "edges": {
      "w-8-12": {
        "road": true
      },
      "w-8-14": {
        "road": true
      },
      "w-7-13": {
        "river": 1
      },
      "w-7-12": {
        "river": 1
      }
    }
  },
  {
    "id": "w-8-14",
    "q": 8,
    "r": 10,
    "terrain": "clear",
    "settlement": {
      "name": "Shaded Vale",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": false
    },
    "edges": {
      "w-8-13": {
        "road": true
      },
      "w-7-14": {
        "river": 1
      },
      "w-7-13": {
        "river": 1
      }
    }
  },
  {
    "id": "w-8-15",
    "q": 8,
    "r": 11,
    "terrain": "clear"
  },
  {
    "id": "w-9-0",
    "q": 9,
    "r": -4,
    "terrain": "mountain"
  },
  {
    "id": "w-9-1",
    "q": 9,
    "r": -3,
    "terrain": "clear"
  },
  {
    "id": "w-9-2",
    "q": 9,
    "r": -2,
    "terrain": "clear"
  },
  {
    "id": "w-9-3",
    "q": 9,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-9-4",
    "q": 9,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-9-5",
    "q": 9,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-9-6",
    "q": 9,
    "r": 2,
    "terrain": "swamp",
    "coastal": true,
    "edges": {
      "w-8-7": {
        "coastal": true
      },
      "w-9-7": {
        "coastal": true
      },
      "w-10-7": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-9-7",
    "q": 9,
    "r": 3,
    "terrain": "sea",
    "edges": {
      "w-8-7": {
        "coastal": true
      },
      "w-9-6": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-9-8",
    "q": 9,
    "r": 4,
    "terrain": "sea",
    "edges": {
      "w-8-9": {
        "coastal": true
      },
      "w-9-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-9-9",
    "q": 9,
    "r": 5,
    "terrain": "clear",
    "coastal": true,
    "settlement": {
      "name": "Chanos",
      "loyalty": null,
      "city": false,
      "fortified": 0,
      "port": false
    },
    "edges": {
      "w-8-9": {
        "road": true,
        "coastal": true
      },
      "w-8-10": {
        "road": true,
        "coastal": true
      },
      "w-9-8": {
        "coastal": true
      },
      "w-9-10": {
        "coastal": true
      },
      "w-10-9": {
        "coastal": true
      },
      "w-10-10": {
        "coastal": true
      }
    },
    "prohibited": true
  },
  {
    "id": "w-9-10",
    "q": 9,
    "r": 6,
    "terrain": "sea",
    "edges": {
      "w-8-10": {
        "coastal": true
      },
      "w-8-11": {
        "coastal": true
      },
      "w-9-9": {
        "coastal": true
      },
      "w-9-11": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-9-11",
    "q": 9,
    "r": 7,
    "terrain": "clear",
    "coastal": true,
    "settlement": {
      "name": "Fort Gorod",
      "loyalty": null,
      "city": false,
      "fortified": 1,
      "port": true
    },
    "edges": {
      "w-8-11": {
        "coastal": true
      },
      "w-9-10": {
        "coastal": true
      },
      "w-10-11": {
        "coastal": true
      },
      "w-10-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-9-12",
    "q": 9,
    "r": 8,
    "terrain": "clear"
  },
  {
    "id": "w-9-13",
    "q": 9,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-9-14",
    "q": 9,
    "r": 10,
    "terrain": "clear"
  },
  {
    "id": "w-10-0",
    "q": 10,
    "r": -5,
    "terrain": "mountain"
  },
  {
    "id": "w-10-1",
    "q": 10,
    "r": -4,
    "terrain": "clear"
  },
  {
    "id": "w-10-2",
    "q": 10,
    "r": -3,
    "terrain": "clear"
  },
  {
    "id": "w-10-3",
    "q": 10,
    "r": -2,
    "terrain": "clear"
  },
  {
    "id": "w-10-4",
    "q": 10,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-10-5",
    "q": 10,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-10-6",
    "q": 10,
    "r": 1,
    "terrain": "clear"
  },
  {
    "id": "w-10-7",
    "q": 10,
    "r": 2,
    "terrain": "sea",
    "edges": {
      "w-9-6": {
        "coastal": true
      },
      "w-11-6": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-10-8",
    "q": 10,
    "r": 3,
    "terrain": "sea"
  },
  {
    "id": "w-10-9",
    "q": 10,
    "r": 4,
    "terrain": "sea",
    "edges": {
      "w-9-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-10-10",
    "q": 10,
    "r": 5,
    "terrain": "sea",
    "edges": {
      "w-9-9": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-10-11",
    "q": 10,
    "r": 6,
    "terrain": "sea",
    "edges": {
      "w-9-11": {
        "coastal": true
      },
      "w-10-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-10-12",
    "q": 10,
    "r": 7,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-10-11": {
        "coastal": true
      },
      "w-9-11": {
        "coastal": true
      },
      "w-11-11": {
        "coastal": true
      },
      "w-11-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-10-13",
    "q": 10,
    "r": 8,
    "terrain": "lair"
  },
  {
    "id": "w-10-14",
    "q": 10,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-10-15",
    "q": 10,
    "r": 10,
    "terrain": "clear"
  },
  {
    "id": "w-11-0",
    "q": 11,
    "r": -5,
    "terrain": "mountain"
  },
  {
    "id": "w-11-1",
    "q": 11,
    "r": -4,
    "terrain": "mountain",
    "mine": true
  },
  {
    "id": "w-11-2",
    "q": 11,
    "r": -3,
    "terrain": "mountain"
  },
  {
    "id": "w-11-3",
    "q": 11,
    "r": -2,
    "terrain": "mountain"
  },
  {
    "id": "w-11-4",
    "q": 11,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-11-5",
    "q": 11,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-11-6",
    "q": 11,
    "r": 1,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-10-7": {
        "coastal": true
      },
      "w-11-7": {
        "coastal": true
      },
      "w-12-7": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-11-7",
    "q": 11,
    "r": 2,
    "terrain": "sea",
    "edges": {
      "w-11-6": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-11-8",
    "q": 11,
    "r": 3,
    "terrain": "sea"
  },
  {
    "id": "w-11-9",
    "q": 11,
    "r": 4,
    "terrain": "lair"
  },
  {
    "id": "w-11-10",
    "q": 11,
    "r": 5,
    "terrain": "sea"
  },
  {
    "id": "w-11-11",
    "q": 11,
    "r": 6,
    "terrain": "sea",
    "edges": {
      "w-10-12": {
        "coastal": true
      },
      "w-11-12": {
        "coastal": true
      },
      "w-12-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-11-12",
    "q": 11,
    "r": 7,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-10-12": {
        "coastal": true
      },
      "w-11-11": {
        "coastal": true
      },
      "w-12-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-11-13",
    "q": 11,
    "r": 8,
    "terrain": "clear"
  },
  {
    "id": "w-11-14",
    "q": 11,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-12-0",
    "q": 12,
    "r": -6,
    "terrain": "mountain"
  },
  {
    "id": "w-12-1",
    "q": 12,
    "r": -5,
    "terrain": "mountain"
  },
  {
    "id": "w-12-2",
    "q": 12,
    "r": -4,
    "terrain": "mountain"
  },
  {
    "id": "w-12-3",
    "q": 12,
    "r": -3,
    "terrain": "mountain"
  },
  {
    "id": "w-12-4",
    "q": 12,
    "r": -2,
    "terrain": "clear"
  },
  {
    "id": "w-12-5",
    "q": 12,
    "r": -1,
    "terrain": "clear"
  },
  {
    "id": "w-12-6",
    "q": 12,
    "r": 0,
    "terrain": "clear"
  },
  {
    "id": "w-12-7",
    "q": 12,
    "r": 1,
    "terrain": "sea",
    "edges": {
      "w-11-6": {
        "coastal": true
      },
      "w-13-6": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-12-8",
    "q": 12,
    "r": 2,
    "terrain": "sea"
  },
  {
    "id": "w-12-9",
    "q": 12,
    "r": 3,
    "terrain": "sea"
  },
  {
    "id": "w-12-10",
    "q": 12,
    "r": 4,
    "terrain": "sea"
  },
  {
    "id": "w-12-11",
    "q": 12,
    "r": 5,
    "terrain": "sea",
    "edges": {
      "w-12-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-12-12",
    "q": 12,
    "r": 6,
    "terrain": "clear",
    "coastal": true,
    "edges": {
      "w-11-11": {
        "coastal": true
      },
      "w-11-12": {
        "coastal": true
      },
      "w-12-11": {
        "coastal": true
      },
      "w-13-11": {
        "coastal": true
      },
      "w-13-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-12-13",
    "q": 12,
    "r": 7,
    "terrain": "clear"
  },
  {
    "id": "w-12-14",
    "q": 12,
    "r": 8,
    "terrain": "clear"
  },
  {
    "id": "w-12-15",
    "q": 12,
    "r": 9,
    "terrain": "clear"
  },
  {
    "id": "w-13-0",
    "q": 13,
    "r": -6,
    "terrain": "mountain"
  },
  {
    "id": "w-13-1",
    "q": 13,
    "r": -5,
    "terrain": "mountain"
  },
  {
    "id": "w-13-2",
    "q": 13,
    "r": -4,
    "terrain": "mountain"
  },
  {
    "id": "w-13-3",
    "q": 13,
    "r": -3,
    "terrain": "mountain"
  },
  {
    "id": "w-13-4",
    "q": 13,
    "r": -2,
    "terrain": "clear"
  },
  {
    "id": "w-13-5",
    "q": 13,
    "r": -1,
    "terrain": "clear",
    "entry": "orcs"
  },
  {
    "id": "w-13-6",
    "q": 13,
    "r": 0,
    "terrain": "clear",
    "coastal": true,
    "entry": "orcs",
    "edges": {
      "w-12-7": {
        "coastal": true
      },
      "w-13-7": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-13-7",
    "q": 13,
    "r": 1,
    "terrain": "sea",
    "entry": "orcs",
    "edges": {
      "w-13-6": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-13-8",
    "q": 13,
    "r": 2,
    "terrain": "sea",
    "entry": "orcs"
  },
  {
    "id": "w-13-9",
    "q": 13,
    "r": 3,
    "terrain": "sea",
    "entry": "orcs"
  },
  {
    "id": "w-13-10",
    "q": 13,
    "r": 4,
    "terrain": "sea",
    "entry": "orcs"
  },
  {
    "id": "w-13-11",
    "q": 13,
    "r": 5,
    "terrain": "sea",
    "entry": "orcs",
    "edges": {
      "w-12-12": {
        "coastal": true
      },
      "w-13-12": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-13-12",
    "q": 13,
    "r": 6,
    "terrain": "clear",
    "coastal": true,
    "entry": "orcs",
    "edges": {
      "w-12-12": {
        "coastal": true
      },
      "w-13-11": {
        "coastal": true
      }
    }
  },
  {
    "id": "w-13-13",
    "q": 13,
    "r": 7,
    "terrain": "clear",
    "entry": "orcs"
  },
  {
    "id": "w-13-14",
    "q": 13,
    "r": 8,
    "terrain": "clear",
    "entry": "orcs"
  }
];

export const unitDefinitions: UnitDefinition[] = [
  {
    "id": "oath-miners",
    "name": "Miners",
    "kingdom": "oathborn",
    "cost": 1,
    "recoveryCost": 0,
    "movement": 2,
    "light": 1,
    "heavy": 0,
    "weakenedLight": 1,
    "weakenedHeavy": 0,
    "count": 9,
    "abilities": [
      "mining"
    ],
    "characteristics": []
  },
  {
    "id": "oath-crossbows",
    "name": "King’s Crossbows",
    "kingdom": "oathborn",
    "cost": 3,
    "recoveryCost": 2,
    "movement": 2,
    "light": 1,
    "heavy": 1,
    "weakenedLight": 1,
    "weakenedHeavy": 1,
    "count": 5,
    "abilities": [
      "ranged"
    ],
    "characteristics": []
  },
  {
    "id": "oath-iron-legion",
    "name": "Iron Legion",
    "kingdom": "oathborn",
    "cost": 4,
    "recoveryCost": 2,
    "movement": 2,
    "light": 1,
    "heavy": 2,
    "weakenedLight": 1,
    "weakenedHeavy": 2,
    "count": 6,
    "abilities": [],
    "characteristics": []
  },
  {
    "id": "oath-dragon-slayers",
    "name": "Dragon Slayers",
    "kingdom": "oathborn",
    "cost": 5,
    "recoveryCost": 3,
    "movement": 3,
    "light": 0,
    "heavy": 2,
    "weakenedLight": 0,
    "weakenedHeavy": 2,
    "count": 2,
    "abilities": [
      "stealth"
    ],
    "characteristics": []
  },
  {
    "id": "oath-takers",
    "name": "Oath Takers",
    "kingdom": "oathborn",
    "cost": 5,
    "recoveryCost": 3,
    "movement": 2,
    "light": 2,
    "heavy": 2,
    "weakenedLight": 2,
    "weakenedHeavy": 2,
    "count": 2,
    "abilities": [],
    "characteristics": []
  },
  {
    "id": "oath-storm-giant",
    "name": "Storm Giant",
    "kingdom": "oathborn",
    "cost": 7,
    "recoveryCost": 4,
    "movement": 2,
    "light": 3,
    "heavy": 3,
    "weakenedLight": 3,
    "weakenedHeavy": 3,
    "count": 1,
    "abilities": [],
    "characteristics": [
      "huge"
    ]
  },
  {
    "id": "oath-siege",
    "name": "Siege Engine",
    "kingdom": "oathborn",
    "cost": 3,
    "recoveryCost": 2,
    "movement": 2,
    "light": 0,
    "heavy": 1,
    "weakenedLight": 0,
    "weakenedHeavy": 1,
    "count": 1,
    "abilities": [],
    "characteristics": [
      "fragile",
      "siege"
    ]
  },
  {
    "id": "fjord-freeholders",
    "name": "Freeholders",
    "kingdom": "fjordland",
    "cost": 2,
    "recoveryCost": 1,
    "movement": 3,
    "light": 2,
    "heavy": 0,
    "weakenedLight": 2,
    "weakenedHeavy": 0,
    "count": 7,
    "abilities": [],
    "characteristics": []
  },
  {
    "id": "fjord-sea-reavers",
    "name": "Sea Reavers",
    "kingdom": "fjordland",
    "cost": 3,
    "recoveryCost": 2,
    "movement": 2,
    "light": 2,
    "heavy": 1,
    "weakenedLight": 2,
    "weakenedHeavy": 1,
    "count": 4,
    "abilities": [],
    "characteristics": []
  },
  {
    "id": "fjord-rangers",
    "name": "Rangers",
    "kingdom": "fjordland",
    "cost": 4,
    "recoveryCost": 2,
    "movement": 4,
    "light": 2,
    "heavy": 0,
    "weakenedLight": 2,
    "weakenedHeavy": 0,
    "count": 3,
    "abilities": [
      "ranged"
    ],
    "characteristics": []
  },
  {
    "id": "fjord-valkyries",
    "name": "Valkyries",
    "kingdom": "fjordland",
    "cost": 5,
    "recoveryCost": 3,
    "movement": 3,
    "light": 2,
    "heavy": 1,
    "weakenedLight": 2,
    "weakenedHeavy": 1,
    "count": 2,
    "abilities": [
      "flying"
    ],
    "characteristics": []
  },
  {
    "id": "fjord-berserkir",
    "name": "Berserkir",
    "kingdom": "fjordland",
    "cost": 6,
    "recoveryCost": 3,
    "movement": 3,
    "light": 2,
    "heavy": 2,
    "weakenedLight": 2,
    "weakenedHeavy": 2,
    "count": 2,
    "abilities": [],
    "characteristics": []
  },
  {
    "id": "fjord-drakken",
    "name": "Drakken",
    "kingdom": "fjordland",
    "cost": 7,
    "recoveryCost": 4,
    "movement": 3,
    "light": 1,
    "heavy": 2,
    "weakenedLight": 1,
    "weakenedHeavy": 2,
    "count": 1,
    "abilities": [
      "stealth",
      "ranged",
      "flying"
    ],
    "characteristics": [
      "feral",
      "huge"
    ]
  },
  {
    "id": "fjord-siege",
    "name": "Siege Engine",
    "kingdom": "fjordland",
    "cost": 3,
    "recoveryCost": 2,
    "movement": 2,
    "light": 0,
    "heavy": 1,
    "weakenedLight": 0,
    "weakenedHeavy": 1,
    "count": 1,
    "abilities": [],
    "characteristics": [
      "fragile",
      "siege"
    ]
  },
  {
    "id": "night-swarm-of-rats",
    "name": "Swarm of Rats",
    "kingdom": "night",
    "cost": 1,
    "recoveryCost": 0,
    "movement": 2,
    "light": 0,
    "heavy": 1,
    "weakenedLight": 0,
    "weakenedHeavy": 0,
    "abilities": [
      "stealth"
    ],
    "characteristics": [
      "feral",
      "fragile"
    ],
    "count": 5
  },
  {
    "id": "night-wolf-pack",
    "name": "Wolf Pack",
    "kingdom": "night",
    "cost": 2,
    "recoveryCost": 1,
    "movement": 4,
    "light": 2,
    "heavy": 0,
    "weakenedLight": 2,
    "weakenedHeavy": 0,
    "abilities": [],
    "characteristics": [
      "feral"
    ],
    "count": 3
  },
  {
    "id": "night-giant-bats",
    "name": "Giant Bats",
    "kingdom": "night",
    "cost": 5,
    "recoveryCost": 3,
    "movement": 5,
    "light": 3,
    "heavy": 0,
    "weakenedLight": 3,
    "weakenedHeavy": 0,
    "abilities": [
      "flying"
    ],
    "characteristics": [
      "feral"
    ],
    "count": 3
  },
  {
    "id": "night-vengeful-ghost",
    "name": "Vengeful Ghost",
    "kingdom": "night",
    "cost": 4,
    "recoveryCost": 0,
    "movement": 3,
    "light": 3,
    "heavy": 0,
    "weakenedLight": 0,
    "weakenedHeavy": 0,
    "abilities": [
      "flying"
    ],
    "characteristics": [
      "fragile"
    ],
    "count": 2
  },
  {
    "id": "night-ghouls",
    "name": "Ghouls",
    "kingdom": "night",
    "cost": 2,
    "recoveryCost": 1,
    "movement": 1,
    "light": 1,
    "heavy": 1,
    "weakenedLight": 1,
    "weakenedHeavy": 1,
    "abilities": [
      "regenerate"
    ],
    "characteristics": [],
    "count": 4
  },
  {
    "id": "night-emissaries",
    "name": "Emissaries",
    "kingdom": "night",
    "cost": 3,
    "recoveryCost": 2,
    "movement": 3,
    "light": 2,
    "heavy": 0,
    "weakenedLight": 2,
    "weakenedHeavy": 0,
    "abilities": [
      "stealth"
    ],
    "characteristics": [],
    "count": 3
  },
  {
    "id": "night-vampire-knights",
    "name": "Vampire Knights",
    "kingdom": "night",
    "cost": 9,
    "recoveryCost": 5,
    "movement": 5,
    "light": 3,
    "heavy": 1,
    "weakenedLight": 3,
    "weakenedHeavy": 1,
    "abilities": [
      "flying"
    ],
    "characteristics": [],
    "count": 2
  },
  {
    "id": "night-siege-engine",
    "name": "Siege Engine",
    "kingdom": "night",
    "cost": 3,
    "recoveryCost": 0,
    "movement": 2,
    "light": 0,
    "heavy": 1,
    "weakenedLight": 0,
    "weakenedHeavy": 0,
    "abilities": [
      "flying"
    ],
    "characteristics": [
      "fragile",
      "siege-engine"
    ],
    "count": 1
  },
  {
    "id": "empire-akritoi",
    "name": "Akritoi",
    "kingdom": "empire",
    "cost": 1,
    "recoveryCost": 0,
    "movement": 3,
    "light": 2,
    "heavy": 0,
    "weakenedLight": 0,
    "weakenedHeavy": 0,
    "abilities": [],
    "characteristics": [
      "fragile"
    ],
    "count": 7
  },
  {
    "id": "empire-psiloi",
    "name": "Psiloi",
    "kingdom": "empire",
    "cost": 2,
    "recoveryCost": 0,
    "movement": 3,
    "light": 2,
    "heavy": 0,
    "weakenedLight": 0,
    "weakenedHeavy": 0,
    "abilities": [
      "ranged"
    ],
    "characteristics": [
      "fragile"
    ],
    "count": 4
  },
  {
    "id": "empire-kontari",
    "name": "Kontari",
    "kingdom": "empire",
    "cost": 3,
    "recoveryCost": 2,
    "movement": 3,
    "light": 3,
    "heavy": 0,
    "weakenedLight": 3,
    "weakenedHeavy": 0,
    "abilities": [],
    "characteristics": [],
    "count": 5
  },
  {
    "id": "empire-siege-engine",
    "name": "Siege Engine",
    "kingdom": "empire",
    "cost": 3,
    "recoveryCost": 0,
    "movement": 2,
    "light": 0,
    "heavy": 1,
    "weakenedLight": 0,
    "weakenedHeavy": 0,
    "abilities": [],
    "characteristics": [
      "fragile",
      "siege-engine"
    ],
    "count": 1
  },
  {
    "id": "empire-korsari",
    "name": "Korsari",
    "kingdom": "empire",
    "cost": 5,
    "recoveryCost": 3,
    "movement": 5,
    "light": 3,
    "heavy": 0,
    "weakenedLight": 3,
    "weakenedHeavy": 0,
    "abilities": [
      "ranged"
    ],
    "characteristics": [],
    "count": 4
  },
  {
    "id": "empire-varyags",
    "name": "Varyags",
    "kingdom": "empire",
    "cost": 6,
    "recoveryCost": 3,
    "movement": 3,
    "light": 2,
    "heavy": 2,
    "weakenedLight": 2,
    "weakenedHeavy": 2,
    "abilities": [],
    "characteristics": [],
    "count": 1
  },
  {
    "id": "empire-cataphracts",
    "name": "Cataphracts",
    "kingdom": "empire",
    "cost": 7,
    "recoveryCost": 4,
    "movement": 4,
    "light": 2,
    "heavy": 2,
    "weakenedLight": 2,
    "weakenedHeavy": 2,
    "abilities": [
      "ranged"
    ],
    "characteristics": [],
    "count": 2
  },
  {
    "id": "goblins-goblin-warriors",
    "name": "Goblin Warriors",
    "kingdom": "goblins",
    "cost": 1,
    "recoveryCost": 0,
    "movement": 4,
    "light": 2,
    "heavy": 0,
    "weakenedLight": 0,
    "weakenedHeavy": 0,
    "abilities": [],
    "characteristics": [
      "fragile"
    ],
    "count": 8
  },
  {
    "id": "goblins-goblin-sneaks",
    "name": "Goblin Sneaks",
    "kingdom": "goblins",
    "cost": 1,
    "recoveryCost": 0,
    "movement": 4,
    "light": 1,
    "heavy": 0,
    "weakenedLight": 0,
    "weakenedHeavy": 0,
    "abilities": [
      "stealth"
    ],
    "characteristics": [
      "fragile"
    ],
    "count": 4
  },
  {
    "id": "goblins-goblin-elites",
    "name": "Goblin Elites",
    "kingdom": "goblins",
    "cost": 2,
    "recoveryCost": 1,
    "movement": 3,
    "light": 2,
    "heavy": 0,
    "weakenedLight": 2,
    "weakenedHeavy": 0,
    "abilities": [
      "ranged"
    ],
    "characteristics": [],
    "count": 5
  },
  {
    "id": "goblins-hobgoblins",
    "name": "Hobgoblins",
    "kingdom": "goblins",
    "cost": 3,
    "recoveryCost": 2,
    "movement": 3,
    "light": 2,
    "heavy": 1,
    "weakenedLight": 2,
    "weakenedHeavy": 1,
    "abilities": [],
    "characteristics": [],
    "count": 3
  },
  {
    "id": "goblins-plague-flies",
    "name": "Plague Flies",
    "kingdom": "goblins",
    "cost": 2,
    "recoveryCost": 1,
    "movement": 3,
    "light": 2,
    "heavy": 0,
    "weakenedLight": 2,
    "weakenedHeavy": 0,
    "abilities": [
      "flying"
    ],
    "characteristics": [
      "feral"
    ],
    "count": 3
  },
  {
    "id": "goblins-hill-troll",
    "name": "Hill Troll",
    "kingdom": "goblins",
    "cost": 5,
    "recoveryCost": 2,
    "movement": 3,
    "light": 1,
    "heavy": 2,
    "weakenedLight": 1,
    "weakenedHeavy": 2,
    "abilities": [
      "regenerate"
    ],
    "characteristics": [],
    "count": 2
  },
  {
    "id": "goblins-mountain-troll",
    "name": "Mountain Troll",
    "kingdom": "goblins",
    "cost": 9,
    "recoveryCost": 5,
    "movement": 3,
    "light": 0,
    "heavy": 3,
    "weakenedLight": 0,
    "weakenedHeavy": 3,
    "abilities": [
      "regenerate"
    ],
    "characteristics": [
      "huge"
    ],
    "count": 1
  },
  {
    "id": "goblins-siege-engine",
    "name": "Siege Engine",
    "kingdom": "goblins",
    "cost": 3,
    "recoveryCost": 0,
    "movement": 2,
    "light": 0,
    "heavy": 1,
    "weakenedLight": 0,
    "weakenedHeavy": 0,
    "abilities": [],
    "characteristics": [
      "fragile",
      "siege-engine"
    ],
    "count": 1
  },
  {
    "id": "orcs-orc-reavers",
    "name": "Orc Reavers",
    "kingdom": "orcs",
    "cost": 2,
    "recoveryCost": 1,
    "movement": 3,
    "light": 1,
    "heavy": 1,
    "weakenedLight": 1,
    "weakenedHeavy": 1,
    "abilities": [],
    "characteristics": [],
    "count": 10
  },
  {
    "id": "orcs-orc-scouts",
    "name": "Orc Scouts",
    "kingdom": "orcs",
    "cost": 1,
    "recoveryCost": 0,
    "movement": 3,
    "light": 2,
    "heavy": 0,
    "weakenedLight": 0,
    "weakenedHeavy": 0,
    "abilities": [
      "ranged"
    ],
    "characteristics": [
      "fragile"
    ],
    "count": 5
  },
  {
    "id": "orcs-wolf-riders",
    "name": "Wolf Riders",
    "kingdom": "orcs",
    "cost": 4,
    "recoveryCost": 2,
    "movement": 4,
    "light": 2,
    "heavy": 1,
    "weakenedLight": 2,
    "weakenedHeavy": 1,
    "abilities": [],
    "characteristics": [],
    "count": 3
  },
  {
    "id": "orcs-siege-engine",
    "name": "Siege Engine",
    "kingdom": "orcs",
    "cost": 3,
    "recoveryCost": 0,
    "movement": 2,
    "light": 0,
    "heavy": 1,
    "weakenedLight": 0,
    "weakenedHeavy": 0,
    "abilities": [],
    "characteristics": [
      "fragile",
      "siege-engine"
    ],
    "count": 1
  },
  {
    "id": "orcs-black-axes",
    "name": "Black Axes",
    "kingdom": "orcs",
    "cost": 4,
    "recoveryCost": 2,
    "movement": 3,
    "light": 3,
    "heavy": 1,
    "weakenedLight": 3,
    "weakenedHeavy": 1,
    "abilities": [],
    "characteristics": [],
    "count": 3
  },
  {
    "id": "orcs-ogre",
    "name": "Ogre",
    "kingdom": "orcs",
    "cost": 4,
    "recoveryCost": 2,
    "movement": 2,
    "light": 2,
    "heavy": 2,
    "weakenedLight": 2,
    "weakenedHeavy": 2,
    "abilities": [],
    "characteristics": [],
    "count": 2
  },
  {
    "id": "orcs-dire-raven",
    "name": "Dire Raven",
    "kingdom": "orcs",
    "cost": 5,
    "recoveryCost": 3,
    "movement": 4,
    "light": 1,
    "heavy": 2,
    "weakenedLight": 1,
    "weakenedHeavy": 2,
    "abilities": [
      "flying"
    ],
    "characteristics": [
      "feral",
      "huge"
    ],
    "count": 2
  }
];

export const scenario: ScenarioDefinition = {
  "id": "drefeld-teaching",
  "name": "Drefeld · teaching battle",
  "official": false,
  "source": "Original digital teaching fixture; printed units and reviewed Wildlands locations from VASSAL 1.7; Undying Rules v1.1 §§3–12. Official introductory setup/victory conditions not imported.",
  "startYear": 1,
  "startSeason": 0,
  "endYear": 1,
  "endSeason": 2,
  "turnOrder": [
    "oathborn",
    "fjordland"
  ],
  "kingdoms": [
    {
      "id": "oathborn",
      "name": "The Oathborn",
      "side": "resistance",
      "gold": 7,
      "income": 2
    },
    {
      "id": "fjordland",
      "name": "Fjordland",
      "side": "invader",
      "gold": 7,
      "income": 3
    }
  ],
  "initialUnits": [
    {
      "defId": "oath-iron-legion",
      "hexId": "w-5-11"
    },
    {
      "defId": "oath-crossbows",
      "hexId": "w-8-14"
    },
    {
      "defId": "oath-miners",
      "hexId": "w-7-12"
    },
    {
      "defId": "fjord-sea-reavers",
      "hexId": "w-2-8"
    },
    {
      "defId": "fjord-rangers",
      "hexId": "w-5-9"
    },
    {
      "defId": "fjord-freeholders",
      "hexId": "w-3-13"
    }
  ],
  "initialControls": {
    "w-2-8": "fjordland",
    "w-5-9": "fjordland",
    "w-8-14": "oathborn"
  },
  "objective": {
    "type": "control",
    "kingdom": "fjordland",
    "hexIds": [
      "w-5-11",
      "w-8-14"
    ],
    "count": 2,
    "deadlineOnly": true
  },
  "notes": [
    "Original teaching fixture, not the official Invasion of Drefeld campaign.",
    "Initial armies, Oathborn starting gold, and the two-settlement objective are digital demonstration choices.",
    "Printed Wildlands hex centers and counter values are source derived. Roads/rivers outside the reviewed Drefeld sector remain under review.",
    "Only the six settlements allowed by the introductory campaign are active; the full official campaign setup and victory rules require the Campaign Book."
  ]
};

export const mapMeta = {
  "name": "The Wildlands",
  "source": "VASSAL Burning Banners v1.7, The_Wildlands.jpg / buildFile.xml HexGrid",
  "columns": 14,
  "offsetRows": 16,
  "hexCount": 217,
  "orientation": "flat-top",
  "coordinateConvention": "axial; r = offset-row - floor(q/2)",
  "geometryStatus": "reviewed-centers",
  "terrainStatus": "reviewed-center-interpretation",
  "edgeStatus": "partial-Drefeld-sector-review",
  "officialScenarioStatus": "not-imported"
} as const;
