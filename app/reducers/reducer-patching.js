import {
  PATCH_ADD,
  PATCH_REMOVE,
  PATCH_SET_CURRENT
} from '../actions/types';

// hardcoded patches for intial state:

const FmAmFilterDistortion = [
  {
    "comment": "audio wave - A4",
    "networkOutput": 0,
    "frequency": 440.0,
    "type": "audio"
  },
  {
    "comment": "audio wave - A4",
    "networkOutput": 1,
    "frequency": 440.0,
    "type": "audio"
  },
  {
    "comment": "LFO for FM",
    "networkOutput": 3,
    "frequency": 880.0,
    "type": "detune-value",
    "range": [-1000, 1000]
  },
  {
    "comment": "LFO for distortion",
    "networkOutput": 5,
    "frequency": 14.0,
    "type": "distortion-curve"
  },
  {
    "comment": "LFO for filter frequency",
    "networkOutput": 4,
    "frequency": 14.0,
    "type": "filter-frequency",
    "range": [0, 2000]
  },
  {
    "comment": "LFO for AM",
    "networkOutput": 2,
    "frequency": 0,
    "type": "gain-value",
    "range": [0, 1]
  }
];

const wavetableMix = [
  {
    "comment": "wave table mix control wave",
    "networkOutput": 0,
    "frequency": 55.0,
    "type": "mix"
  },
  {
    "comment": "wave table audio wave",
    "networkOutput": 1,
    "frequency": 110.0,
    "type": "audio"
  },
  {
    "comment": "wave table audio wave",
    "networkOutput": 2,
    "frequency": 220.0,
    "type": "audio"
  },
  {
    "comment": "wave table audio wave",
    "networkOutput": 3,
    "frequency": 440.0,
    "type": "audio"
  },
  {
    "comment": "wave table audio wave",
    "networkOutput": 4,
    "frequency": 660.0,
    "type": "audio"
  },
  {
    "comment": "wave table audio wave",
    "networkOutput": 5,
    "frequency": 880.0,
    "type": "audio"
  },
  {
    "comment": "wave table audio wave",
    "networkOutput": 6,
    "frequency": 1760.0,
    "type": "audio"
  },
  {
    "comment": "wave table audio wave",
    "networkOutput": 7,
    "frequency": 3520.0,
    "type": "audio"
  },
  {
    "comment": "wave table audio wave",
    "networkOutput": 8,
    "frequency": 7040.0,
    "type": "audio"
  },
  {
    "comment": "wave table audio wave",
    "networkOutput": 9,
    "frequency": 14080.0,
    "type": "audio"
  }
];

const INITIAL_STATE = {
  patches: new Map([
    ['FM-AM-filter-distortion', FmAmFilterDistortion],
    ['wavetable-mix', wavetableMix]
  ]),
  currentPatchKey: 'wavetable-mix'
};

export default function( state = INITIAL_STATE, action ) {
  switch( action.type ) {
    case PATCH_ADD:
      return state;
    case PATCH_REMOVE:
      return state;
    case PATCH_SET_CURRENT:
      return state;
    default:
      return state;
  }
}
