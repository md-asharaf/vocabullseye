const fs = require('fs');
const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader.js');
// Wait, three/examples is not easily usable in raw node without DOM/TextDecoder.
// Let's just grep the binary FBX file for "Bow" or "Arrow"
