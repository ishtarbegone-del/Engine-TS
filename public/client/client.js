// src/3rdparty/audio.js
(function() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  if (window.AudioContext) {
    window.audioContext = new window.AudioContext({ sampleRate: 22050 });
  }
  var fixAudioContext = function(e) {
    if (window.audioContext) {
      var buffer = window.audioContext.createBuffer(1, 1, 22050);
      var source = window.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(window.audioContext.destination);
      if (source.start) {
        source.start(0);
      } else if (source.play) {
        source.play(0);
      } else if (source.noteOn) {
        source.noteOn(0);
      }
    }
    document.removeEventListener("touchstart", fixAudioContext);
    document.removeEventListener("touchend", fixAudioContext);
    document.removeEventListener("click", fixAudioContext);
  };
  document.addEventListener("touchstart", fixAudioContext);
  document.addEventListener("touchend", fixAudioContext);
  document.addEventListener("click", fixAudioContext);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (window.audioContext) {
        window.audioContext.resume();
      }
    }
  });
})();
var waveGain;
async function playWave(data) {
  try {
    const audioBuffer = await window.audioContext.decodeAudioData(new Uint8Array(data).buffer);
    let bufferSource = window.audioContext.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(waveGain);
    bufferSource.start();
  } catch (e) {
    console.error(e);
  }
}
function setWaveVolume(dB) {
  if (!waveGain) {
    waveGain = window.audioContext.createGain();
    waveGain.connect(window.audioContext.destination);
  }
  waveGain.gain.value = Math.pow(10, dB / 20);
}

// src/3rdparty/tinymidipcm/tinymidipcm.mjs
async function loadTinyMidiPCM(moduleArg = {}) {
  var moduleRtn;
  var Module = moduleArg;
  var ENVIRONMENT_IS_WEB = true;
  var ENVIRONMENT_IS_WORKER = false;
  var ENVIRONMENT_IS_NODE = false;
  var ENVIRONMENT_IS_SHELL = false;
  var arguments_ = [];
  var thisProgram = "./this.program";
  var quit_ = (status, toThrow) => {
    throw toThrow;
  };
  var _scriptName = import.meta.url;
  var scriptDirectory = "";
  function locateFile(path) {
    if (Module["locateFile"]) {
      return Module["locateFile"](path, scriptDirectory);
    }
    return scriptDirectory + path;
  }
  var readAsync, readBinary;
  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    try {
      scriptDirectory = new URL(".", _scriptName).href;
    } catch {}
    {
      readAsync = async (url) => {
        var response = await fetch(url, { credentials: "same-origin" });
        if (response.ok) {
          return response.arrayBuffer();
        }
        throw new Error(response.status + " : " + response.url);
      };
    }
  } else {}
  var out = console.log.bind(console);
  var err = console.error.bind(console);
  var wasmBinary;
  var ABORT = false;
  var EXITSTATUS;
  function assert(condition, text) {
    if (!condition) {
      abort(text);
    }
  }
  var isFileURI = (filename) => filename.startsWith("file://");
  var readyPromiseResolve, readyPromiseReject;
  var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
  var HEAP64, HEAPU64;
  var runtimeInitialized = false;
  function updateMemoryViews() {
    var b = wasmMemory.buffer;
    HEAP8 = new Int8Array(b);
    HEAP16 = new Int16Array(b);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
    HEAPU16 = new Uint16Array(b);
    HEAP32 = new Int32Array(b);
    HEAPU32 = new Uint32Array(b);
    HEAPF32 = new Float32Array(b);
    HEAPF64 = new Float64Array(b);
    HEAP64 = new BigInt64Array(b);
    HEAPU64 = new BigUint64Array(b);
  }
  function preRun() {
    if (Module["preRun"]) {
      if (typeof Module["preRun"] == "function")
        Module["preRun"] = [Module["preRun"]];
      while (Module["preRun"].length) {
        addOnPreRun(Module["preRun"].shift());
      }
    }
    callRuntimeCallbacks(onPreRuns);
  }
  function initRuntime() {
    runtimeInitialized = true;
    wasmExports["__wasm_call_ctors"]();
  }
  function postRun() {
    if (Module["postRun"]) {
      if (typeof Module["postRun"] == "function")
        Module["postRun"] = [Module["postRun"]];
      while (Module["postRun"].length) {
        addOnPostRun(Module["postRun"].shift());
      }
    }
    callRuntimeCallbacks(onPostRuns);
  }
  function abort(what) {
    Module["onAbort"]?.(what);
    what = "Aborted(" + what + ")";
    err(what);
    ABORT = true;
    what += ". Build with -sASSERTIONS for more info.";
    var e = new WebAssembly.RuntimeError(what);
    readyPromiseReject?.(e);
    throw e;
  }
  var wasmBinaryFile;
  function findWasmBinary() {
    if (Module["locateFile"]) {
      return locateFile("tinymidipcm.wasm");
    }
    return new URL("tinymidipcm.wasm", import.meta.url).href;
  }
  function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
  }
  async function getWasmBinary(binaryFile) {
    if (!wasmBinary) {
      try {
        var response = await readAsync(binaryFile);
        return new Uint8Array(response);
      } catch {}
    }
    return getBinarySync(binaryFile);
  }
  async function instantiateArrayBuffer(binaryFile, imports) {
    try {
      var binary = await getWasmBinary(binaryFile);
      var instance = await WebAssembly.instantiate(binary, imports);
      return instance;
    } catch (reason) {
      err(`failed to asynchronously prepare wasm: ${reason}`);
      abort(reason);
    }
  }
  async function instantiateAsync(binary, binaryFile, imports) {
    if (!binary) {
      try {
        var response = fetch(binaryFile, { credentials: "same-origin" });
        var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
        return instantiationResult;
      } catch (reason) {
        err(`wasm streaming compile failed: ${reason}`);
        err("falling back to ArrayBuffer instantiation");
      }
    }
    return instantiateArrayBuffer(binaryFile, imports);
  }
  function getWasmImports() {
    var imports = {
      env: wasmImports,
      wasi_snapshot_preview1: wasmImports
    };
    return imports;
  }
  async function createWasm() {
    function receiveInstance(instance, module) {
      wasmExports = instance.exports;
      assignWasmExports(wasmExports);
      updateMemoryViews();
      return wasmExports;
    }
    function receiveInstantiationResult(result2) {
      return receiveInstance(result2["instance"]);
    }
    var info = getWasmImports();
    if (Module["instantiateWasm"]) {
      return new Promise((resolve, reject) => {
        Module["instantiateWasm"](info, (inst, mod) => {
          resolve(receiveInstance(inst, mod));
        });
      });
    }
    wasmBinaryFile ??= findWasmBinary();
    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports;
  }

  class ExitStatus {
    name = "ExitStatus";
    constructor(status) {
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }
  }
  var callRuntimeCallbacks = (callbacks) => {
    while (callbacks.length > 0) {
      callbacks.shift()(Module);
    }
  };
  var onPostRuns = [];
  var addOnPostRun = (cb) => onPostRuns.push(cb);
  var onPreRuns = [];
  var addOnPreRun = (cb) => onPreRuns.push(cb);
  function getValue(ptr, type = "i8") {
    if (type.endsWith("*"))
      type = "*";
    switch (type) {
      case "i1":
        return HEAP8[ptr];
      case "i8":
        return HEAP8[ptr];
      case "i16":
        return HEAP16[ptr >> 1];
      case "i32":
        return HEAP32[ptr >> 2];
      case "i64":
        return HEAP64[ptr >> 3];
      case "float":
        return HEAPF32[ptr >> 2];
      case "double":
        return HEAPF64[ptr >> 3];
      case "*":
        return HEAPU32[ptr >> 2];
      default:
        abort(`invalid type for getValue: ${type}`);
    }
  }
  var noExitRuntime = true;
  function setValue(ptr, value, type = "i8") {
    if (type.endsWith("*"))
      type = "*";
    switch (type) {
      case "i1":
        HEAP8[ptr] = value;
        break;
      case "i8":
        HEAP8[ptr] = value;
        break;
      case "i16":
        HEAP16[ptr >> 1] = value;
        break;
      case "i32":
        HEAP32[ptr >> 2] = value;
        break;
      case "i64":
        HEAP64[ptr >> 3] = BigInt(value);
        break;
      case "float":
        HEAPF32[ptr >> 2] = value;
        break;
      case "double":
        HEAPF64[ptr >> 3] = value;
        break;
      case "*":
        HEAPU32[ptr >> 2] = value;
        break;
      default:
        abort(`invalid type for setValue: ${type}`);
    }
  }
  var stackRestore = (val) => __emscripten_stack_restore(val);
  var stackSave = () => _emscripten_stack_get_current();
  var getHeapMax = () => 2147483648;
  var alignMemory = (size, alignment) => {
    return Math.ceil(size / alignment) * alignment;
  };
  var growMemory = (size) => {
    var oldHeapSize = wasmMemory.buffer.byteLength;
    var pages = (size - oldHeapSize + 65535) / 65536 | 0;
    try {
      wasmMemory.grow(pages);
      updateMemoryViews();
      return 1;
    } catch (e) {}
  };
  var _emscripten_resize_heap = (requestedSize) => {
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    var maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize) {
      return false;
    }
    for (var cutDown = 1;cutDown <= 4; cutDown *= 2) {
      var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
      overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
      var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
      var replacement = growMemory(newSize);
      if (replacement) {
        return true;
      }
    }
    return false;
  };
  {
    if (Module["noExitRuntime"])
      noExitRuntime = Module["noExitRuntime"];
    if (Module["print"])
      out = Module["print"];
    if (Module["printErr"])
      err = Module["printErr"];
    if (Module["wasmBinary"])
      wasmBinary = Module["wasmBinary"];
    if (Module["arguments"])
      arguments_ = Module["arguments"];
    if (Module["thisProgram"])
      thisProgram = Module["thisProgram"];
    if (Module["preInit"]) {
      if (typeof Module["preInit"] == "function")
        Module["preInit"] = [Module["preInit"]];
      while (Module["preInit"].length > 0) {
        Module["preInit"].shift()();
      }
    }
  }
  Module["setValue"] = setValue;
  Module["getValue"] = getValue;
  var _malloc, _free, _tsf_load_memory, _tsf_close, _tsf_reset, _tsf_set_output, _realloc, _tsf_channel_set_bank_preset, _tml_load_memory, _midi_render, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current, memory, __indirect_function_table, wasmMemory;
  function assignWasmExports(wasmExports2) {
    _malloc = Module["_malloc"] = wasmExports2["malloc"];
    _free = Module["_free"] = wasmExports2["free"];
    _tsf_load_memory = Module["_tsf_load_memory"] = wasmExports2["tsf_load_memory"];
    _tsf_close = Module["_tsf_close"] = wasmExports2["tsf_close"];
    _tsf_reset = Module["_tsf_reset"] = wasmExports2["tsf_reset"];
    _tsf_set_output = Module["_tsf_set_output"] = wasmExports2["tsf_set_output"];
    _realloc = Module["_realloc"] = wasmExports2["realloc"];
    _tsf_channel_set_bank_preset = Module["_tsf_channel_set_bank_preset"] = wasmExports2["tsf_channel_set_bank_preset"];
    _tml_load_memory = Module["_tml_load_memory"] = wasmExports2["tml_load_memory"];
    _midi_render = Module["_midi_render"] = wasmExports2["midi_render"];
    __emscripten_stack_restore = wasmExports2["_emscripten_stack_restore"];
    __emscripten_stack_alloc = wasmExports2["_emscripten_stack_alloc"];
    _emscripten_stack_get_current = wasmExports2["emscripten_stack_get_current"];
    memory = wasmMemory = wasmExports2["memory"];
    __indirect_function_table = wasmExports2["__indirect_function_table"];
  }
  var wasmImports = {
    emscripten_resize_heap: _emscripten_resize_heap
  };
  function run() {
    preRun();
    function doRun() {
      Module["calledRun"] = true;
      if (ABORT)
        return;
      initRuntime();
      readyPromiseResolve?.(Module);
      Module["onRuntimeInitialized"]?.();
      postRun();
    }
    if (Module["setStatus"]) {
      Module["setStatus"]("Running...");
      setTimeout(() => {
        setTimeout(() => Module["setStatus"](""), 1);
        doRun();
      }, 1);
    } else {
      doRun();
    }
  }
  var wasmExports;
  wasmExports = await createWasm();
  run();
  if (runtimeInitialized) {
    moduleRtn = Module;
  } else {
    moduleRtn = new Promise((resolve, reject) => {
      readyPromiseResolve = resolve;
      readyPromiseReject = reject;
    });
  }
  return moduleRtn;
}
var tinymidipcm_default = loadTinyMidiPCM;

// src/3rdparty/tinymidipcm.js
class TinyMidiPCM {
  constructor(options = {}) {
    this.wasmModule = undefined;
    this.soundfontBufferPtr = 0;
    this.soundfontPtr = 0;
    this.midiBufferPtr = 0;
    this.renderInterval = options.renderInterval || 100;
    this.sampleRate = options.sampleRate || 44100;
    this.channels = options.channels || 2;
    this.gain = options.gain || 0;
    if (!options.bufferSize) {
      this.setBufferDuration(1);
    } else {
      this.bufferSize = options.bufferSize;
    }
    this.onPCMData = options.onPCMData || (() => {});
    this.onRenderEnd = options.onRenderEnd || (() => {});
    this.renderTimer = undefined;
    this.test = 0;
  }
  async init() {
    if (this.wasmModule) {
      return;
    }
    this.wasmModule = await tinymidipcm_default();
    this.pcmBufferPtr = this.wasmModule._malloc(this.bufferSize);
    this.msecsPtr = this.wasmModule._malloc(8);
  }
  setBufferDuration(seconds) {
    this.bufferSize = 4 * this.sampleRate * this.channels * seconds;
  }
  ensureInitialized() {
    if (!this.wasmModule) {
      throw new Error(`${this.constructor.name} not initalized. call .init()`);
    }
  }
  setSoundfont(buffer) {
    this.ensureInitialized();
    const { _malloc, _free, _tsf_load_memory, _tsf_set_output } = this.wasmModule;
    _free(this.soundfontBufferPtr);
    this.soundfontBufferPtr = _malloc(buffer.length);
    this.wasmModule.HEAPU8.set(buffer, this.soundfontBufferPtr);
    this.soundfontPtr = _tsf_load_memory(this.soundfontBufferPtr, buffer.length);
    _tsf_set_output(this.soundfontPtr, this.channels === 2 ? 0 : 2, this.sampleRate, this.gain);
  }
  getPCMBuffer() {
    this.ensureInitialized();
    const pcm = new Uint8Array(this.bufferSize);
    pcm.set(this.wasmModule.HEAPU8.subarray(this.pcmBufferPtr, this.pcmBufferPtr + this.bufferSize));
    return pcm;
  }
  getMIDIMessagePtr(midiBuffer) {
    const { _malloc, _free, _tml_load_memory } = this.wasmModule;
    _free(this.midiBufferPtr);
    this.midiBufferPtr = _malloc(midiBuffer.length);
    this.wasmModule.HEAPU8.set(midiBuffer, this.midiBufferPtr);
    return _tml_load_memory(this.midiBufferPtr, midiBuffer.length);
  }
  renderMIDIMessage(midiMessagePtr) {
    const { _midi_render } = this.wasmModule;
    return _midi_render(this.soundfontPtr, midiMessagePtr, this.channels, this.sampleRate, this.pcmBufferPtr, this.bufferSize, this.msecsPtr);
  }
  render(midiBuffer) {
    this.ensureInitialized();
    if (!this.soundfontPtr) {
      throw new Error("no soundfont buffer set. call .setSoundfont");
    }
    window.clearTimeout(this.renderTimer);
    const { setValue, getValue, _tsf_reset, _tsf_channel_set_bank_preset } = this.wasmModule;
    setValue(this.msecsPtr, 0, "double");
    _tsf_reset(this.soundfontPtr);
    _tsf_channel_set_bank_preset(this.soundfontPtr, 9, 128, 0);
    let midiMessagePtr = this.getMIDIMessagePtr(midiBuffer);
    const boundRender = function() {
      midiMessagePtr = this.renderMIDIMessage(midiMessagePtr);
      const pcm = this.getPCMBuffer();
      this.onPCMData(pcm);
      if (midiMessagePtr) {
        this.renderTimer = setTimeout(boundRender, this.renderInterval);
      } else {
        this.onRenderEnd(getValue(this.msecsPtr, "double"));
      }
    }.bind(this);
    this.renderTimer = setTimeout(() => {
      boundRender();
    }, 16);
  }
}
(async () => {
  const channels = 2;
  const sampleRate = 22050;
  const flushTime = 250;
  const renderInterval = 30;
  const fadeseconds = 2;
  let midiTimeout = null;
  let fadeTimeout = null;
  let samples = new Float32Array;
  let gainNode = window.audioContext.createGain();
  gainNode.gain.setValueAtTime(0.1, window.audioContext.currentTime);
  gainNode.connect(window.audioContext.destination);
  let lastTime = window.audioContext.currentTime;
  let bufferSources = [];
  const tinyMidiPCM = new TinyMidiPCM({
    renderInterval,
    onPCMData: (pcm) => {
      let float32 = new Float32Array(pcm.buffer);
      let temp = new Float32Array(samples.length + float32.length);
      temp.set(samples, 0);
      temp.set(float32, samples.length);
      samples = temp;
    },
    onRenderEnd: (ms) => {},
    bufferSize: 1024 * 100,
    sampleRate
  });
  await tinyMidiPCM.init();
  const soundfontRes = await fetch(new URL("SCC1_Florestan.sf2", import.meta.url));
  const soundfontBuffer = new Uint8Array(await soundfontRes.arrayBuffer());
  tinyMidiPCM.setSoundfont(soundfontBuffer);
  function flush() {
    if (!window.audioContext || !samples.length) {
      return;
    }
    let bufferSource = window.audioContext.createBufferSource();
    const length = samples.length / channels;
    const audioBuffer = window.audioContext.createBuffer(channels, length, sampleRate);
    for (let channel = 0;channel < channels; channel++) {
      const audioData = audioBuffer.getChannelData(channel);
      let offset = channel;
      for (let i = 0;i < length; i++) {
        audioData[i] = samples[offset];
        offset += channels;
      }
    }
    if (lastTime < window.audioContext.currentTime) {
      lastTime = window.audioContext.currentTime;
    }
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(gainNode);
    bufferSource.start(lastTime);
    bufferSources.push(bufferSource);
    lastTime += audioBuffer.duration;
    samples = new Float32Array;
  }
  let flushInterval;
  function fadeOut(callback) {
    const currentTime = window.audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(currentTime);
    gainNode.gain.setTargetAtTime(0, currentTime, 0.5);
    return setTimeout(callback, fadeseconds * 1000);
  }
  function stop() {
    if (flushInterval) {
      clearInterval(flushInterval);
    }
    samples = new Float32Array;
    if (bufferSources.length) {
      let temp = gainNode.gain.value;
      gainNode.gain.setValueAtTime(0, window.audioContext.currentTime);
      bufferSources.forEach((bufferSource) => {
        bufferSource.stop(window.audioContext.currentTime);
      });
      bufferSources = [];
      gainNode.gain.setValueAtTime(temp, window.audioContext.currentTime);
    }
  }
  function start(vol, midiBuffer) {
    if (vol !== -1) {
      window._tinyMidiVolume(vol);
    }
    lastTime = window.audioContext.currentTime;
    flushInterval = setInterval(flush, flushTime);
    tinyMidiPCM.render(midiBuffer);
  }
  window._tinyMidiStop = async (fade) => {
    if (fade) {
      fadeTimeout = fadeOut(() => {
        stop();
      });
    } else {
      stop();
      clearTimeout(midiTimeout);
      clearTimeout(fadeTimeout);
    }
  };
  window._tinyMidiVolume = (vol = 1) => {
    gainNode.gain.setValueAtTime(vol, window.audioContext.currentTime);
  };
  window._tinyMidiPlay = async (midiBuffer, vol, fade) => {
    if (!midiBuffer) {
      return;
    }
    await window._tinyMidiStop(fade);
    if (fade) {
      midiTimeout = setTimeout(() => {
        start(vol, midiBuffer);
      }, fadeseconds * 1000);
    } else {
      start(vol, midiBuffer);
    }
  };
})();
function playMidi(data, dB, fade) {
  if (window._tinyMidiPlay) {
    window._tinyMidiPlay(data, Math.pow(10, dB / 20), fade);
  }
}
function setMidiVolume(dB) {
  if (window._tinyMidiVolume) {
    window._tinyMidiVolume(Math.pow(10, dB / 20));
  }
}
function stopMidi(fade) {
  if (window._tinyMidiStop) {
    window._tinyMidiStop(fade);
  }
}

// src/3rdparty/bzip2-wasm/bzip2.mjs
async function loadBZip2WASM(moduleArg = {}) {
  var moduleRtn;
  var Module = moduleArg;
  var ENVIRONMENT_IS_WEB = true;
  var ENVIRONMENT_IS_WORKER = false;
  var ENVIRONMENT_IS_NODE = false;
  var ENVIRONMENT_IS_SHELL = false;
  var arguments_ = [];
  var thisProgram = "./this.program";
  var quit_ = (status, toThrow) => {
    throw toThrow;
  };
  var _scriptName = import.meta.url;
  var scriptDirectory = "";
  function locateFile(path) {
    if (Module["locateFile"]) {
      return Module["locateFile"](path, scriptDirectory);
    }
    return scriptDirectory + path;
  }
  var readAsync, readBinary;
  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    try {
      scriptDirectory = new URL(".", _scriptName).href;
    } catch {}
    {
      readAsync = async (url) => {
        var response = await fetch(url, { credentials: "same-origin" });
        if (response.ok) {
          return response.arrayBuffer();
        }
        throw new Error(response.status + " : " + response.url);
      };
    }
  } else {}
  var out = console.log.bind(console);
  var err = console.error.bind(console);
  var wasmBinary;
  var ABORT = false;
  var EXITSTATUS;
  function assert(condition, text) {
    if (!condition) {
      abort(text);
    }
  }
  var isFileURI = (filename) => filename.startsWith("file://");
  var readyPromiseResolve, readyPromiseReject;
  var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
  var HEAP64, HEAPU64;
  var runtimeInitialized = false;
  function updateMemoryViews() {
    var b = wasmMemory.buffer;
    HEAP8 = new Int8Array(b);
    HEAP16 = new Int16Array(b);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
    HEAPU16 = new Uint16Array(b);
    HEAP32 = new Int32Array(b);
    HEAPU32 = new Uint32Array(b);
    HEAPF32 = new Float32Array(b);
    HEAPF64 = new Float64Array(b);
    HEAP64 = new BigInt64Array(b);
    HEAPU64 = new BigUint64Array(b);
  }
  function preRun() {
    if (Module["preRun"]) {
      if (typeof Module["preRun"] == "function")
        Module["preRun"] = [Module["preRun"]];
      while (Module["preRun"].length) {
        addOnPreRun(Module["preRun"].shift());
      }
    }
    callRuntimeCallbacks(onPreRuns);
  }
  function initRuntime() {
    runtimeInitialized = true;
    wasmExports["__wasm_call_ctors"]();
  }
  function postRun() {
    if (Module["postRun"]) {
      if (typeof Module["postRun"] == "function")
        Module["postRun"] = [Module["postRun"]];
      while (Module["postRun"].length) {
        addOnPostRun(Module["postRun"].shift());
      }
    }
    callRuntimeCallbacks(onPostRuns);
  }
  function abort(what) {
    Module["onAbort"]?.(what);
    what = "Aborted(" + what + ")";
    err(what);
    ABORT = true;
    what += ". Build with -sASSERTIONS for more info.";
    var e = new WebAssembly.RuntimeError(what);
    readyPromiseReject?.(e);
    throw e;
  }
  var wasmBinaryFile;
  function findWasmBinary() {
    if (Module["locateFile"]) {
      return locateFile("bzip2.wasm");
    }
    return new URL("bzip2.wasm", import.meta.url).href;
  }
  function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
  }
  async function getWasmBinary(binaryFile) {
    if (!wasmBinary) {
      try {
        var response = await readAsync(binaryFile);
        return new Uint8Array(response);
      } catch {}
    }
    return getBinarySync(binaryFile);
  }
  async function instantiateArrayBuffer(binaryFile, imports) {
    try {
      var binary = await getWasmBinary(binaryFile);
      var instance = await WebAssembly.instantiate(binary, imports);
      return instance;
    } catch (reason) {
      err(`failed to asynchronously prepare wasm: ${reason}`);
      abort(reason);
    }
  }
  async function instantiateAsync(binary, binaryFile, imports) {
    if (!binary) {
      try {
        var response = fetch(binaryFile, { credentials: "same-origin" });
        var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
        return instantiationResult;
      } catch (reason) {
        err(`wasm streaming compile failed: ${reason}`);
        err("falling back to ArrayBuffer instantiation");
      }
    }
    return instantiateArrayBuffer(binaryFile, imports);
  }
  function getWasmImports() {
    var imports = {
      env: wasmImports,
      wasi_snapshot_preview1: wasmImports
    };
    return imports;
  }
  async function createWasm() {
    function receiveInstance(instance, module) {
      wasmExports = instance.exports;
      assignWasmExports(wasmExports);
      updateMemoryViews();
      return wasmExports;
    }
    function receiveInstantiationResult(result2) {
      return receiveInstance(result2["instance"]);
    }
    var info = getWasmImports();
    if (Module["instantiateWasm"]) {
      return new Promise((resolve, reject) => {
        Module["instantiateWasm"](info, (inst, mod) => {
          resolve(receiveInstance(inst, mod));
        });
      });
    }
    wasmBinaryFile ??= findWasmBinary();
    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports;
  }

  class ExitStatus {
    name = "ExitStatus";
    constructor(status) {
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }
  }
  var callRuntimeCallbacks = (callbacks) => {
    while (callbacks.length > 0) {
      callbacks.shift()(Module);
    }
  };
  var onPostRuns = [];
  var addOnPostRun = (cb) => onPostRuns.push(cb);
  var onPreRuns = [];
  var addOnPreRun = (cb) => onPreRuns.push(cb);
  function getValue(ptr, type = "i8") {
    if (type.endsWith("*"))
      type = "*";
    switch (type) {
      case "i1":
        return HEAP8[ptr];
      case "i8":
        return HEAP8[ptr];
      case "i16":
        return HEAP16[ptr >> 1];
      case "i32":
        return HEAP32[ptr >> 2];
      case "i64":
        return HEAP64[ptr >> 3];
      case "float":
        return HEAPF32[ptr >> 2];
      case "double":
        return HEAPF64[ptr >> 3];
      case "*":
        return HEAPU32[ptr >> 2];
      default:
        abort(`invalid type for getValue: ${type}`);
    }
  }
  var noExitRuntime = true;
  function setValue(ptr, value, type = "i8") {
    if (type.endsWith("*"))
      type = "*";
    switch (type) {
      case "i1":
        HEAP8[ptr] = value;
        break;
      case "i8":
        HEAP8[ptr] = value;
        break;
      case "i16":
        HEAP16[ptr >> 1] = value;
        break;
      case "i32":
        HEAP32[ptr >> 2] = value;
        break;
      case "i64":
        HEAP64[ptr >> 3] = BigInt(value);
        break;
      case "float":
        HEAPF32[ptr >> 2] = value;
        break;
      case "double":
        HEAPF64[ptr >> 3] = value;
        break;
      case "*":
        HEAPU32[ptr >> 2] = value;
        break;
      default:
        abort(`invalid type for setValue: ${type}`);
    }
  }
  var stackRestore = (val) => __emscripten_stack_restore(val);
  var stackSave = () => _emscripten_stack_get_current();
  var getHeapMax = () => 2147483648;
  var alignMemory = (size, alignment) => {
    return Math.ceil(size / alignment) * alignment;
  };
  var growMemory = (size) => {
    var oldHeapSize = wasmMemory.buffer.byteLength;
    var pages = (size - oldHeapSize + 65535) / 65536 | 0;
    try {
      wasmMemory.grow(pages);
      updateMemoryViews();
      return 1;
    } catch (e) {}
  };
  var _emscripten_resize_heap = (requestedSize) => {
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    var maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize) {
      return false;
    }
    for (var cutDown = 1;cutDown <= 4; cutDown *= 2) {
      var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
      overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
      var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
      var replacement = growMemory(newSize);
      if (replacement) {
        return true;
      }
    }
    return false;
  };
  var runtimeKeepaliveCounter = 0;
  var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
  var _proc_exit = (code) => {
    EXITSTATUS = code;
    if (!keepRuntimeAlive()) {
      Module["onExit"]?.(code);
      ABORT = true;
    }
    quit_(code, new ExitStatus(code));
  };
  var exitJS = (status, implicit) => {
    EXITSTATUS = status;
    _proc_exit(status);
  };
  var _exit = exitJS;
  var _fd_close = (fd) => {
    return 52;
  };
  var INT53_MAX = 9007199254740992;
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num);
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
    return 70;
  }
  var printCharBuffers = [null, [], []];
  var UTF8Decoder = globalThis.TextDecoder && new TextDecoder;
  var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
    var maxIdx = idx + maxBytesToRead;
    if (ignoreNul)
      return maxIdx;
    while (heapOrArray[idx] && !(idx >= maxIdx))
      ++idx;
    return idx;
  };
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
    var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
      return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
    }
    var str = "";
    while (idx < endPtr) {
      var u0 = heapOrArray[idx++];
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      var u1 = heapOrArray[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }
      var u2 = heapOrArray[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      }
    }
    return str;
  };
  var printChar = (stream, curr) => {
    var buffer = printCharBuffers[stream];
    if (curr === 0 || curr === 10) {
      (stream === 1 ? out : err)(UTF8ArrayToString(buffer));
      buffer.length = 0;
    } else {
      buffer.push(curr);
    }
  };
  var flush_NO_FILESYSTEM = () => {
    if (printCharBuffers[1].length)
      printChar(1, 10);
    if (printCharBuffers[2].length)
      printChar(2, 10);
  };
  var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : "";
  };
  var SYSCALLS = {
    varargs: undefined,
    getStr(ptr) {
      var ret = UTF8ToString(ptr);
      return ret;
    }
  };
  var _fd_write = (fd, iov, iovcnt, pnum) => {
    var num = 0;
    for (var i = 0;i < iovcnt; i++) {
      var ptr = HEAPU32[iov >> 2];
      var len = HEAPU32[iov + 4 >> 2];
      iov += 8;
      for (var j = 0;j < len; j++) {
        printChar(fd, HEAPU8[ptr + j]);
      }
      num += len;
    }
    HEAPU32[pnum >> 2] = num;
    return 0;
  };
  {
    if (Module["noExitRuntime"])
      noExitRuntime = Module["noExitRuntime"];
    if (Module["print"])
      out = Module["print"];
    if (Module["printErr"])
      err = Module["printErr"];
    if (Module["wasmBinary"])
      wasmBinary = Module["wasmBinary"];
    if (Module["arguments"])
      arguments_ = Module["arguments"];
    if (Module["thisProgram"])
      thisProgram = Module["thisProgram"];
    if (Module["preInit"]) {
      if (typeof Module["preInit"] == "function")
        Module["preInit"] = [Module["preInit"]];
      while (Module["preInit"].length > 0) {
        Module["preInit"].shift()();
      }
    }
  }
  Module["setValue"] = setValue;
  Module["getValue"] = getValue;
  var _malloc, _free, _BZ2_bzBuffToBuffCompress, _BZ2_bzBuffToBuffDecompress, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current, memory, __indirect_function_table, wasmMemory;
  function assignWasmExports(wasmExports2) {
    _malloc = Module["_malloc"] = wasmExports2["malloc"];
    _free = Module["_free"] = wasmExports2["free"];
    _BZ2_bzBuffToBuffCompress = Module["_BZ2_bzBuffToBuffCompress"] = wasmExports2["BZ2_bzBuffToBuffCompress"];
    _BZ2_bzBuffToBuffDecompress = Module["_BZ2_bzBuffToBuffDecompress"] = wasmExports2["BZ2_bzBuffToBuffDecompress"];
    __emscripten_stack_restore = wasmExports2["_emscripten_stack_restore"];
    __emscripten_stack_alloc = wasmExports2["_emscripten_stack_alloc"];
    _emscripten_stack_get_current = wasmExports2["emscripten_stack_get_current"];
    memory = wasmMemory = wasmExports2["memory"];
    __indirect_function_table = wasmExports2["__indirect_function_table"];
  }
  var wasmImports = {
    emscripten_resize_heap: _emscripten_resize_heap,
    exit: _exit,
    fd_close: _fd_close,
    fd_seek: _fd_seek,
    fd_write: _fd_write
  };
  function run() {
    preRun();
    function doRun() {
      Module["calledRun"] = true;
      if (ABORT)
        return;
      initRuntime();
      readyPromiseResolve?.(Module);
      Module["onRuntimeInitialized"]?.();
      postRun();
    }
    if (Module["setStatus"]) {
      Module["setStatus"]("Running...");
      setTimeout(() => {
        setTimeout(() => Module["setStatus"](""), 1);
        doRun();
      }, 1);
    } else {
      doRun();
    }
  }
  var wasmExports;
  wasmExports = await createWasm();
  run();
  if (runtimeInitialized) {
    moduleRtn = Module;
  } else {
    moduleRtn = new Promise((resolve, reject) => {
      readyPromiseResolve = resolve;
      readyPromiseReject = reject;
    });
  }
  return moduleRtn;
}
var bzip2_default = loadBZip2WASM;

// src/3rdparty/bzip2-wasm.js
var ERROR_MESSAGES = {
  "-2": "BZ_PARAM_ERROR: incorrect parameters",
  "-3": "BZ_MEM_ERROR: couldn't allocate enough memory",
  "-4": "BZ_DATA_ERROR: data integrity error when decompressing",
  "-5": "BZ_DATA_ERROR_MAGIC: compressed data has incorrect header",
  "-7": "BZ_UNEXPECTED_EOF: compressed data ends too early",
  "-8": "BZ_OUTBUFF_FULL: destination buffer is full"
};

class BZ2Wasm {
  constructor() {
    this.wasmModule = undefined;
  }
  async init() {
    if (this.wasmModule) {
      return;
    }
    this.wasmModule = await bzip2_default();
  }
  ensureInitialized() {
    if (!this.wasmModule) {
      throw new Error(`${this.constructor.name} not initalized. call .init()`);
    }
  }
  handleError(returnValue, destPtr, destLengthPtr) {
    if (returnValue === 0) {
      return;
    }
    this.wasmModule._free(destPtr);
    this.wasmModule._free(destLengthPtr);
    const errorMessage = ERROR_MESSAGES[returnValue];
    if (errorMessage) {
      throw new Error(errorMessage);
    }
    throw new Error(`error code: ${returnValue}`);
  }
  createWASMBuffers(source, destLength) {
    const { _malloc, setValue, HEAPU8 } = this.wasmModule;
    const sourcePtr = _malloc(source.length);
    HEAPU8.set(source, sourcePtr);
    const destPtr = _malloc(destLength);
    const destLengthPtr = _malloc(destLength);
    setValue(destLengthPtr, destLength, "i32");
    return { sourcePtr, destPtr, destLengthPtr };
  }
  createBuffer(destPtr, destLengthPtr) {
    const { _free, getValue, HEAPU8 } = this.wasmModule;
    const destLength = getValue(destLengthPtr, "i32");
    const dest = new Uint8Array(destLength);
    dest.set(HEAPU8.subarray(destPtr, destPtr + destLength));
    _free(destPtr);
    _free(destLengthPtr);
    return dest;
  }
  decompress(src, decompressedLength, prependHeader = false, containsDecompressedLength = false) {
    let compressed = new Uint8Array(src);
    if (containsDecompressedLength) {
      decompressedLength = compressed[0] << 24 | compressed[1] << 16 | compressed[2] << 8 | compressed[3];
      compressed[0] = 66;
      compressed[1] = 90;
      compressed[2] = 104;
      compressed[3] = 49;
      prependHeader = false;
    }
    if (prependHeader) {
      const temp = new Uint8Array(compressed.length + 4);
      temp[0] = 66;
      temp[1] = 90;
      temp[2] = 104;
      temp[3] = 49;
      temp.set(compressed, 4);
      compressed = temp;
    }
    this.ensureInitialized();
    const { sourcePtr: compressedPtr, destPtr: decompressedPtr, destLengthPtr: decompressedLengthPtr } = this.createWASMBuffers(compressed, decompressedLength);
    const returnValue = this.wasmModule._BZ2_bzBuffToBuffDecompress(decompressedPtr, decompressedLengthPtr, compressedPtr, compressed.length, 0, 0);
    this.wasmModule._free(compressedPtr);
    this.handleError(returnValue, decompressedPtr, decompressedLengthPtr);
    return this.createBuffer(decompressedPtr, decompressedLengthPtr);
  }
  compress(decompressed, prefixLength = false, removeHeader = false, blockSize = 1, compressedLength = 0) {
    this.ensureInitialized();
    if (!compressedLength) {
      compressedLength = decompressed.length;
    }
    if (compressedLength < 128) {
      compressedLength = 128;
    }
    if (blockSize <= 0 || blockSize > 9) {
      throw new RangeError("blockSize should be between 1-9");
    }
    const { sourcePtr: decompressedPtr, destPtr: compressedPtr, destLengthPtr: compressedLengthPtr } = this.createWASMBuffers(decompressed, compressedLength);
    const returnValue = this.wasmModule._BZ2_bzBuffToBuffCompress(compressedPtr, compressedLengthPtr, decompressedPtr, decompressed.length, blockSize, 0, 30);
    this.wasmModule._free(decompressedPtr);
    this.handleError(returnValue, compressedPtr, compressedLengthPtr);
    const buf = this.createBuffer(compressedPtr, compressedLengthPtr);
    if (prefixLength) {
      buf[0] = decompressed.length >> 24 & 255;
      buf[1] = decompressed.length >> 16 & 255;
      buf[2] = decompressed.length >> 8 & 255;
      buf[3] = decompressed.length & 255;
    }
    if (removeHeader) {
      return buf.subarray(4);
    }
    return buf;
  }
}
var BZip2 = new BZ2Wasm;
var bzip2_wasm_default = BZip2;

// src/datastruct/Linkable.ts
class Linkable {
  key = 0n;
  next = null;
  prev = null;
  unlink() {
    if (this.prev != null) {
      this.prev.next = this.next;
      if (this.next) {
        this.next.prev = this.prev;
      }
      this.next = null;
      this.prev = null;
    }
  }
}

// src/datastruct/Linkable2.ts
class Linkable2 extends Linkable {
  next2 = null;
  prev2 = null;
  unlink2() {
    if (this.prev2 !== null) {
      this.prev2.next2 = this.next2;
      if (this.next2) {
        this.next2.prev2 = this.prev2;
      }
      this.next2 = null;
      this.prev2 = null;
    }
  }
}

// src/datastruct/LinkList.ts
class LinkList {
  sentinel = new Linkable;
  cursor = null;
  constructor() {
    this.sentinel.next = this.sentinel;
    this.sentinel.prev = this.sentinel;
  }
  clear() {
    while (true) {
      const node = this.sentinel.next;
      if (node === this.sentinel) {
        return;
      }
      node?.unlink();
    }
  }
  push(node) {
    if (node.prev) {
      node.unlink();
    }
    node.prev = this.sentinel.prev;
    node.next = this.sentinel;
    if (node.prev) {
      node.prev.next = node;
    }
    node.next.prev = node;
  }
  pushFront(node) {
    if (node.prev) {
      node.unlink();
    }
    node.prev = this.sentinel;
    node.next = this.sentinel.next;
    node.prev.next = node;
    if (node.next) {
      node.next.prev = node;
    }
  }
  popFront() {
    const node = this.sentinel.next;
    if (node === this.sentinel) {
      return null;
    }
    node?.unlink();
    return node;
  }
  head() {
    const node = this.sentinel.next;
    if (node === this.sentinel) {
      this.cursor = null;
      return null;
    }
    this.cursor = node?.next ?? null;
    return node;
  }
  tail() {
    const node = this.sentinel.prev;
    if (node === this.sentinel) {
      this.cursor = null;
      return null;
    }
    this.cursor = node?.prev ?? null;
    return node;
  }
  next() {
    const node = this.cursor;
    if (node === this.sentinel) {
      this.cursor = null;
      return null;
    }
    this.cursor = node?.next ?? null;
    return node;
  }
  prev() {
    const node = this.cursor;
    if (node === this.sentinel) {
      this.cursor = null;
      return null;
    }
    this.cursor = node?.prev ?? null;
    return node;
  }
}

// src/util/JsUtil.ts
var sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var downloadUrl = async (url) => new Uint8Array(await (await fetch(url)).arrayBuffer());
function arraycopy(src, srcPos, dst, dstPos, length) {
  while (length--)
    dst[dstPos++] = src[srcPos++];
}
function bytesToBigInt(bytes) {
  let result = 0n;
  for (let index = 0;index < bytes.length; index++) {
    result = result << 8n | BigInt(bytes[index]);
  }
  return result;
}
function bigIntToBytes(bigInt) {
  const bytes = [];
  while (bigInt > 0n) {
    bytes.unshift(Number(bigInt & 0xffn));
    bigInt >>= 8n;
  }
  if (bytes[0] & 128) {
    bytes.unshift(0);
  }
  return new Uint8Array(bytes);
}
function bigIntModPow(base, exponent, modulus) {
  let result = 1n;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = result * base % modulus;
    }
    base = base * base % modulus;
    exponent >>= 1n;
  }
  return result;
}

// src/io/Packet.ts
class Packet extends Linkable2 {
  static CRC32_POLYNOMIAL = 3988292384;
  static crctable = new Int32Array(256);
  static bitmask = new Uint32Array(33);
  static cacheMin = new LinkList;
  static cacheMid = new LinkList;
  static cacheMax = new LinkList;
  static cacheMinCount = 0;
  static cacheMidCount = 0;
  static cacheMaxCount = 0;
  static {
    for (let i = 0;i < 32; i++) {
      Packet.bitmask[i] = (1 << i) - 1;
    }
    Packet.bitmask[32] = 4294967295;
    for (let i = 0;i < 256; i++) {
      let remainder = i;
      for (let bit = 0;bit < 8; bit++) {
        if ((remainder & 1) === 1) {
          remainder = remainder >>> 1 ^ Packet.CRC32_POLYNOMIAL;
        } else {
          remainder >>>= 1;
        }
      }
      Packet.crctable[i] = remainder;
    }
  }
  static getcrc(src, off, len) {
    let crc = 4294967295;
    for (let i = off;i < off + len; i++) {
      crc = crc >>> 8 ^ Packet.crctable[(crc ^ src[i]) & 255];
    }
    return ~crc;
  }
  static checkcrc(src, offset, length, expected = 0) {
    return Packet.getcrc(src, offset, length) == expected;
  }
  view;
  data;
  pos = 0;
  bitPos = 0;
  random = null;
  constructor(src) {
    if (!src) {
      throw new Error;
    }
    super();
    if (src instanceof Int8Array) {
      this.data = new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
    } else {
      this.data = src;
    }
    this.view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength);
  }
  get length() {
    return this.view.byteLength;
  }
  get available() {
    return this.view.byteLength - this.pos;
  }
  static alloc(type) {
    let cached = null;
    if (type === 0 && Packet.cacheMinCount > 0) {
      Packet.cacheMinCount--;
      cached = Packet.cacheMin.popFront();
    } else if (type === 1 && Packet.cacheMidCount > 0) {
      Packet.cacheMidCount--;
      cached = Packet.cacheMid.popFront();
    } else if (type === 2 && Packet.cacheMaxCount > 0) {
      Packet.cacheMaxCount--;
      cached = Packet.cacheMax.popFront();
    }
    if (cached) {
      cached.pos = 0;
      return cached;
    }
    if (type === 0) {
      return new Packet(new Uint8Array(100));
    } else if (type === 1) {
      return new Packet(new Uint8Array(5000));
    } else {
      return new Packet(new Uint8Array(30000));
    }
  }
  release() {
    this.pos = 0;
    if (this.length === 100 && Packet.cacheMinCount < 1000) {
      Packet.cacheMin.push(this);
      Packet.cacheMinCount++;
    } else if (this.length === 5000 && Packet.cacheMidCount < 250) {
      Packet.cacheMid.push(this);
      Packet.cacheMidCount++;
    } else if (this.length === 30000 && Packet.cacheMaxCount < 50) {
      Packet.cacheMax.push(this);
      Packet.cacheMaxCount++;
    }
  }
  g1() {
    return this.view.getUint8(this.pos++);
  }
  g1b() {
    return this.view.getInt8(this.pos++);
  }
  g2() {
    const result = this.view.getUint16(this.pos);
    this.pos += 2;
    return result;
  }
  g2b() {
    const result = this.view.getInt16(this.pos);
    this.pos += 2;
    return result;
  }
  g3() {
    const result = this.view.getUint8(this.pos++) << 16 | this.view.getUint16(this.pos);
    this.pos += 2;
    return result;
  }
  g4() {
    const result = this.view.getInt32(this.pos);
    this.pos += 4;
    return result;
  }
  g8() {
    const result = this.view.getBigInt64(this.pos);
    this.pos += 8;
    return result;
  }
  gsmarts() {
    return this.view.getUint8(this.pos) < 128 ? this.g1() - 64 : this.g2() - 49152;
  }
  gsmart() {
    return this.view.getUint8(this.pos) < 128 ? this.g1() : this.g2() - 32768;
  }
  gjstr() {
    const view = this.view;
    const length = view.byteLength;
    let str = "";
    let b;
    while ((b = view.getUint8(this.pos++)) !== 10 && this.pos < length) {
      str += String.fromCharCode(b);
    }
    return str;
  }
  gdata(length, offset, dest) {
    dest.set(this.data.subarray(this.pos, this.pos + length), offset);
    this.pos += length;
  }
  p1Enc(opcode) {
    this.view.setUint8(this.pos++, opcode + (this.random?.nextInt ?? 0) & 255);
  }
  p1(value) {
    this.view.setUint8(this.pos++, value);
  }
  p2(value) {
    this.view.setUint16(this.pos, value);
    this.pos += 2;
  }
  ip2(value) {
    this.view.setUint16(this.pos, value, true);
    this.pos += 2;
  }
  p3(value) {
    this.view.setUint8(this.pos++, value >> 16);
    this.view.setUint16(this.pos, value);
    this.pos += 2;
  }
  p4(value) {
    this.view.setInt32(this.pos, value);
    this.pos += 4;
  }
  ip4(value) {
    this.view.setInt32(this.pos, value, true);
    this.pos += 4;
  }
  p8(value) {
    this.view.setBigInt64(this.pos, value);
    this.pos += 8;
  }
  pjstr(str) {
    const view = this.view;
    const length = str.length;
    for (let i = 0;i < length; i++) {
      view.setUint8(this.pos++, str.charCodeAt(i));
    }
    view.setUint8(this.pos++, 10);
  }
  pdata(src, length, offset) {
    this.data.set(src.subarray(offset, offset + length), this.pos);
    this.pos += length - offset;
  }
  psize1(size) {
    this.view.setUint8(this.pos - size - 1, size);
  }
  gBitStart() {
    this.bitPos = this.pos << 3;
  }
  gBitEnd() {
    this.pos = this.bitPos + 7 >>> 3;
  }
  gBit(n) {
    let bytePos = this.bitPos >>> 3;
    let remaining = 8 - (this.bitPos & 7);
    let value = 0;
    this.bitPos += n;
    for (;n > remaining; remaining = 8) {
      value += (this.view.getUint8(bytePos++) & Packet.bitmask[remaining]) << n - remaining;
      n -= remaining;
    }
    if (n === remaining) {
      value += this.view.getUint8(bytePos) & Packet.bitmask[remaining];
    } else {
      value += this.view.getUint8(bytePos) >>> remaining - n & Packet.bitmask[n];
    }
    return value;
  }
  rsaenc(mod, exp) {
    const length = this.pos;
    this.pos = 0;
    const temp = new Uint8Array(length);
    this.gdata(length, 0, temp);
    const bigRaw = bytesToBigInt(temp);
    const bigEnc = bigIntModPow(bigRaw, exp, mod);
    const rawEnc = bigIntToBytes(bigEnc);
    this.pos = 0;
    this.p1(rawEnc.length);
    this.pdata(rawEnc, rawEnc.length, 0);
  }
}

// src/client/InputTracking.ts
class InputTracking {
  static active = false;
  static out = null;
  static old = null;
  static trackedCount = 0;
  static lastTime = 0;
  static lastMoveTime = 0;
  static lastX = 0;
  static lastY = 0;
  static setEnabled() {
    this.out = Packet.alloc(1);
    this.old = null;
    this.lastTime = performance.now();
    this.active = true;
  }
  static setDisabled() {
    this.active = false;
    this.out = null;
    this.old = null;
  }
  static flush() {
    let buffer = null;
    if (this.old && this.active) {
      buffer = this.old;
    }
    this.old = null;
    return buffer;
  }
  static stop() {
    let buffer = null;
    if (this.out && this.out.pos > 0 && this.active) {
      buffer = this.out;
    }
    this.setDisabled();
    return buffer;
  }
  static ensureCapacity(n) {
    if (!this.out) {
      return;
    }
    if (this.out.pos + n >= 500) {
      const buffer = this.out;
      this.out = Packet.alloc(1);
      this.old = buffer;
    }
  }
  static mousePressed(x, y, button, _pointerType) {
    if (!this.out) {
      return;
    }
    if (!this.active && (x >= 0 && x < 789 && y >= 0 && y < 532)) {
      return;
    }
    this.trackedCount++;
    const now = performance.now();
    let delta = (now - this.lastTime) / 10 | 0;
    if (delta > 250) {
      delta = 250;
    }
    this.lastTime = now;
    this.ensureCapacity(5);
    if (button === 2) {
      this.out.p1(1);
    } else {
      this.out.p1(2);
    }
    this.out.p1(delta);
    this.out.p3(x + (y << 10));
  }
  static mouseReleased(button, _pointerType) {
    if (!this.out) {
      return;
    }
    if (!this.active) {
      return;
    }
    this.trackedCount++;
    const now = performance.now();
    let delta = (now - this.lastTime) / 10 | 0;
    if (delta > 250) {
      delta = 250;
    }
    this.lastTime = now;
    this.ensureCapacity(2);
    if (button === 2) {
      this.out.p1(3);
    } else {
      this.out.p1(4);
    }
    this.out.p1(delta);
  }
  static mouseMoved(x, y, _pointerType) {
    if (!this.out) {
      return;
    }
    if (!this.active && (x >= 0 && x < 789 && y >= 0 && y < 532)) {
      return;
    }
    const now = performance.now();
    if (now - this.lastMoveTime < 50) {
      return;
    }
    this.lastMoveTime = now;
    this.trackedCount++;
    let delta = (now - this.lastTime) / 10 | 0;
    if (delta > 250) {
      delta = 250;
    }
    this.lastTime = now;
    if (x - this.lastX < 8 && x - this.lastX >= -8 && y - this.lastY < 8 && y - this.lastY >= -8) {
      this.ensureCapacity(3);
      this.out.p1(5);
      this.out.p1(delta);
      this.out.p1(x + (y - this.lastY + 8 << 4) + 8 - this.lastX);
    } else if (x - this.lastX < 128 && x - this.lastX >= -128 && y - this.lastY < 128 && y - this.lastY >= -128) {
      this.ensureCapacity(4);
      this.out.p1(6);
      this.out.p1(delta);
      this.out.p1(x + 128 - this.lastX);
      this.out.p1(y + 128 - this.lastY);
    } else {
      this.ensureCapacity(5);
      this.out.p1(7);
      this.out.p1(delta);
      this.out.p3(x + (y << 10));
    }
    this.lastX = x;
    this.lastY = y;
  }
  static keyPressed(key) {
    if (!this.out) {
      return;
    }
    if (!this.active) {
      return;
    }
    this.trackedCount++;
    const now = performance.now();
    let delta = (now - this.lastTime) / 10 | 0;
    if (delta > 250) {
      delta = 250;
    }
    this.lastTime = now;
    if (key === 1000) {
      key = 11;
    } else if (key === 1001) {
      key = 12;
    } else if (key === 1002) {
      key = 14;
    } else if (key === 1003) {
      key = 15;
    } else if (key >= 1008) {
      key -= 992;
    }
    this.ensureCapacity(3);
    this.out.p1(8);
    this.out.p1(delta);
    this.out.p1(key);
  }
  static keyReleased(key) {
    if (!this.out) {
      return;
    }
    if (!this.active) {
      return;
    }
    this.trackedCount++;
    const now = performance.now();
    let delta = (now - this.lastTime) / 10 | 0;
    if (delta > 250) {
      delta = 250;
    }
    this.lastTime = now;
    if (key === 1000) {
      key = 11;
    } else if (key === 1001) {
      key = 12;
    } else if (key === 1002) {
      key = 14;
    } else if (key === 1003) {
      key = 15;
    } else if (key >= 1008) {
      key -= 992;
    }
    this.ensureCapacity(3);
    this.out.p1(9);
    this.out.p1(delta);
    this.out.p1(key);
  }
  static focusGained() {
    if (!this.out) {
      return;
    }
    if (!this.active) {
      return;
    }
    this.trackedCount++;
    const now = performance.now();
    let delta = (now - this.lastTime) / 10 | 0;
    if (delta > 250) {
      delta = 250;
    }
    this.lastTime = now;
    this.ensureCapacity(2);
    this.out.p1(10);
    this.out.p1(delta);
  }
  static focusLost() {
    if (!this.out) {
      return;
    }
    if (!this.active) {
      return;
    }
    this.trackedCount++;
    const now = performance.now();
    let delta = (now - this.lastTime) / 10 | 0;
    if (delta > 250) {
      delta = 250;
    }
    this.lastTime = now;
    this.ensureCapacity(2);
    this.out.p1(11);
    this.out.p1(delta);
  }
  static mouseEntered() {
    if (!this.out) {
      return;
    }
    if (!this.active) {
      return;
    }
    this.trackedCount++;
    const now = performance.now();
    let delta = (now - this.lastTime) / 10 | 0;
    if (delta > 250) {
      delta = 250;
    }
    this.lastTime = now;
    this.ensureCapacity(2);
    this.out.p1(12);
    this.out.p1(delta);
  }
  static mouseExited() {
    if (!this.out) {
      return;
    }
    if (!this.active) {
      return;
    }
    this.trackedCount++;
    const now = performance.now();
    let delta = (now - this.lastTime) / 10 | 0;
    if (delta > 250) {
      delta = 250;
    }
    this.lastTime = now;
    this.ensureCapacity(2);
    this.out.p1(13);
    this.out.p1(delta);
  }
}

// src/client/KeyCodes.ts
var CanvasEnabledKeys = ["F7", "F9", "F10", "F11", "F12"];
var KeyCodes = new Map;
KeyCodes.set("ArrowLeft", { code: 37, ch: 1 });
KeyCodes.set("ArrowRight", { code: 39, ch: 2 });
KeyCodes.set("ArrowUp", { code: 38, ch: 3 });
KeyCodes.set("ArrowDown", { code: 40, ch: 4 });
KeyCodes.set("Control", { code: 17, ch: 5 });
KeyCodes.set("Shift", { code: 16, ch: 6 });
KeyCodes.set("Alt", { code: 18, ch: 7 });
KeyCodes.set("Backspace", { code: 8, ch: 8 });
KeyCodes.set("Tab", { code: 9, ch: 9 });
KeyCodes.set("Enter", { code: 10, ch: 10 });
KeyCodes.set("Escape", { code: 27, ch: 27 });
KeyCodes.set(" ", { code: 32, ch: 32 });
KeyCodes.set("Delete", { code: 127, ch: 127 });
KeyCodes.set("Home", { code: 36, ch: 1000 });
KeyCodes.set("End", { code: 35, ch: 1001 });
KeyCodes.set("PageUp", { code: 33, ch: 1002 });
KeyCodes.set("PageDown", { code: 34, ch: 1003 });
KeyCodes.set("F1", { code: 112, ch: 1008 });
KeyCodes.set("F2", { code: 113, ch: 1009 });
KeyCodes.set("F3", { code: 114, ch: 1010 });
KeyCodes.set("F4", { code: 115, ch: 1011 });
KeyCodes.set("F5", { code: 116, ch: 1012 });
KeyCodes.set("F6", { code: 117, ch: 1013 });
KeyCodes.set("F7", { code: 118, ch: 1014 });
KeyCodes.set("F8", { code: 119, ch: 1015 });
KeyCodes.set("F9", { code: 120, ch: 1016 });
KeyCodes.set("F10", { code: 121, ch: 1017 });
KeyCodes.set("F11", { code: 122, ch: 1018 });
KeyCodes.set("F12", { code: 123, ch: 1019 });
KeyCodes.set("CapsLock", { code: 20, ch: 65535 });
KeyCodes.set("Meta", { code: 524, ch: 65535 });
KeyCodes.set("Insert", { code: 155, ch: 65535 });
KeyCodes.set("`", { code: 192, ch: 96 });
KeyCodes.set("~", { code: 192, ch: 126 });
KeyCodes.set("!", { code: 49, ch: 33 });
KeyCodes.set("@", { code: 50, ch: 64 });
KeyCodes.set("#", { code: 51, ch: 35 });
KeyCodes.set("£", { code: 51, ch: 163 });
KeyCodes.set("$", { code: 52, ch: 36 });
KeyCodes.set("%", { code: 53, ch: 37 });
KeyCodes.set("^", { code: 54, ch: 94 });
KeyCodes.set("&", { code: 55, ch: 38 });
KeyCodes.set("*", { code: 56, ch: 42 });
KeyCodes.set("(", { code: 57, ch: 40 });
KeyCodes.set(")", { code: 48, ch: 41 });
KeyCodes.set("-", { code: 45, ch: 45 });
KeyCodes.set("_", { code: 45, ch: 95 });
KeyCodes.set("=", { code: 61, ch: 61 });
KeyCodes.set("+", { code: 61, ch: 43 });
KeyCodes.set("[", { code: 91, ch: 91 });
KeyCodes.set("{", { code: 91, ch: 123 });
KeyCodes.set("]", { code: 93, ch: 93 });
KeyCodes.set("}", { code: 93, ch: 125 });
KeyCodes.set("\\", { code: 92, ch: 92 });
KeyCodes.set("|", { code: 92, ch: 124 });
KeyCodes.set(";", { code: 59, ch: 59 });
KeyCodes.set(":", { code: 59, ch: 58 });
KeyCodes.set("'", { code: 222, ch: 39 });
KeyCodes.set('"', { code: 222, ch: 34 });
KeyCodes.set(",", { code: 44, ch: 44 });
KeyCodes.set("<", { code: 44, ch: 60 });
KeyCodes.set(".", { code: 46, ch: 46 });
KeyCodes.set(">", { code: 46, ch: 62 });
KeyCodes.set("/", { code: 47, ch: 47 });
KeyCodes.set("?", { code: 47, ch: 63 });
KeyCodes.set("0", { code: 48, ch: 48 });
KeyCodes.set("1", { code: 49, ch: 49 });
KeyCodes.set("2", { code: 50, ch: 50 });
KeyCodes.set("3", { code: 51, ch: 51 });
KeyCodes.set("4", { code: 52, ch: 52 });
KeyCodes.set("5", { code: 53, ch: 53 });
KeyCodes.set("6", { code: 54, ch: 54 });
KeyCodes.set("7", { code: 55, ch: 55 });
KeyCodes.set("8", { code: 56, ch: 56 });
KeyCodes.set("9", { code: 57, ch: 57 });
KeyCodes.set("a", { code: 65, ch: 97 });
KeyCodes.set("b", { code: 66, ch: 98 });
KeyCodes.set("c", { code: 67, ch: 99 });
KeyCodes.set("d", { code: 68, ch: 100 });
KeyCodes.set("e", { code: 69, ch: 101 });
KeyCodes.set("f", { code: 70, ch: 102 });
KeyCodes.set("g", { code: 71, ch: 103 });
KeyCodes.set("h", { code: 72, ch: 104 });
KeyCodes.set("i", { code: 73, ch: 105 });
KeyCodes.set("j", { code: 74, ch: 106 });
KeyCodes.set("k", { code: 75, ch: 107 });
KeyCodes.set("l", { code: 76, ch: 108 });
KeyCodes.set("m", { code: 77, ch: 109 });
KeyCodes.set("n", { code: 78, ch: 110 });
KeyCodes.set("o", { code: 79, ch: 111 });
KeyCodes.set("p", { code: 80, ch: 112 });
KeyCodes.set("q", { code: 81, ch: 113 });
KeyCodes.set("r", { code: 82, ch: 114 });
KeyCodes.set("s", { code: 83, ch: 115 });
KeyCodes.set("t", { code: 84, ch: 116 });
KeyCodes.set("u", { code: 85, ch: 117 });
KeyCodes.set("v", { code: 86, ch: 118 });
KeyCodes.set("w", { code: 87, ch: 119 });
KeyCodes.set("x", { code: 88, ch: 120 });
KeyCodes.set("y", { code: 89, ch: 121 });
KeyCodes.set("z", { code: 90, ch: 122 });
KeyCodes.set("A", { code: 65, ch: 65 });
KeyCodes.set("B", { code: 66, ch: 66 });
KeyCodes.set("C", { code: 67, ch: 67 });
KeyCodes.set("D", { code: 68, ch: 68 });
KeyCodes.set("E", { code: 69, ch: 69 });
KeyCodes.set("F", { code: 70, ch: 70 });
KeyCodes.set("G", { code: 71, ch: 71 });
KeyCodes.set("H", { code: 72, ch: 72 });
KeyCodes.set("I", { code: 73, ch: 73 });
KeyCodes.set("J", { code: 74, ch: 74 });
KeyCodes.set("K", { code: 75, ch: 75 });
KeyCodes.set("L", { code: 76, ch: 76 });
KeyCodes.set("M", { code: 77, ch: 77 });
KeyCodes.set("N", { code: 78, ch: 78 });
KeyCodes.set("O", { code: 79, ch: 79 });
KeyCodes.set("P", { code: 80, ch: 80 });
KeyCodes.set("Q", { code: 81, ch: 81 });
KeyCodes.set("R", { code: 82, ch: 82 });
KeyCodes.set("S", { code: 83, ch: 83 });
KeyCodes.set("T", { code: 84, ch: 84 });
KeyCodes.set("U", { code: 85, ch: 85 });
KeyCodes.set("V", { code: 86, ch: 86 });
KeyCodes.set("W", { code: 87, ch: 87 });
KeyCodes.set("X", { code: 88, ch: 88 });
KeyCodes.set("Y", { code: 89, ch: 89 });
KeyCodes.set("Z", { code: 90, ch: 90 });

// src/graphics/Canvas.ts
var canvas = document.getElementById("canvas");
var canvas2d = canvas?.getContext("2d", {
  desynchronized: false,
  alpha: false
});

// src/graphics/Pix2D.ts
class Pix2D extends Linkable2 {
  static pixels = new Int32Array;
  static width = 0;
  static height = 0;
  static clipMinX = 0;
  static clipMaxX = 0;
  static clipMinY = 0;
  static clipMaxY = 0;
  static sizeX = 0;
  static maxX = 0;
  static maxY = 0;
  static setPixels(pixels, width, height) {
    this.pixels = pixels;
    this.width = width;
    this.height = height;
    this.setClipping(0, 0, width, height);
  }
  static resetClipping() {
    this.clipMinX = 0;
    this.clipMinY = 0;
    this.clipMaxX = this.width;
    this.clipMaxY = this.height;
    this.sizeX = this.clipMaxX - 1;
    this.maxX = this.clipMaxX / 2 | 0;
  }
  static setClipping(x1, y1, x2, y2) {
    if (x1 < 0) {
      x1 = 0;
    }
    if (y1 < 0) {
      y1 = 0;
    }
    if (x2 > this.width) {
      x2 = this.width;
    }
    if (y2 > this.height) {
      y2 = this.height;
    }
    this.clipMinY = y1;
    this.clipMaxY = y2;
    this.clipMinX = x1;
    this.clipMaxX = x2;
    this.sizeX = this.clipMaxX - 1;
    this.maxX = this.clipMaxX / 2 | 0;
    this.maxY = this.clipMaxY / 2 | 0;
  }
  static cls() {
    const len = this.width * this.height;
    for (let i = 0;i < len; i++) {
      this.pixels[i] = 0;
    }
  }
  static fillRectTrans(x, y, width, height, rgb, alpha) {
    if (x < this.clipMinX) {
      width -= this.clipMinX - x;
      x = this.clipMinX;
    }
    if (y < this.clipMinY) {
      height -= this.clipMinY - y;
      y = this.clipMinY;
    }
    if (x + width > this.clipMaxX) {
      width = this.clipMaxX - x;
    }
    if (y + height > this.clipMaxY) {
      height = this.clipMaxY - y;
    }
    const invAlpha = 256 - alpha;
    const r0 = (rgb >> 16 & 255) * alpha;
    const g0 = (rgb >> 8 & 255) * alpha;
    const b0 = (rgb & 255) * alpha;
    const step = this.width - width;
    let offset = x + y * this.width;
    for (let i = 0;i < height; i++) {
      for (let j = -width;j < 0; j++) {
        const r1 = (this.pixels[offset] >> 16 & 255) * invAlpha;
        const g1 = (this.pixels[offset] >> 8 & 255) * invAlpha;
        const b1 = (this.pixels[offset] & 255) * invAlpha;
        const mixed = (r0 + r1 >> 8 << 16) + (g0 + g1 >> 8 << 8) + (b0 + b1 >> 8);
        this.pixels[offset++] = mixed;
      }
      offset += step;
    }
  }
  static fillRect(x, y, width, height, rgb) {
    if (x < this.clipMinX) {
      width -= this.clipMinX - x;
      x = this.clipMinX;
    }
    if (y < this.clipMinY) {
      height -= this.clipMinY - y;
      y = this.clipMinY;
    }
    if (x + width > this.clipMaxX) {
      width = this.clipMaxX - x;
    }
    if (y + height > this.clipMaxY) {
      height = this.clipMaxY - y;
    }
    const step = this.width - width;
    let offset = x + y * this.width;
    for (let i = -height;i < 0; i++) {
      for (let j = -width;j < 0; j++) {
        this.pixels[offset++] = rgb;
      }
      offset += step;
    }
  }
  static drawRect(x, y, w, h, rgb) {
    this.hline(x, y, rgb, w);
    this.hline(x, y + h - 1, rgb, w);
    this.vline(x, y, rgb, h);
    this.vline(x + w - 1, y, rgb, h);
  }
  static hline(x, y, rgb, width) {
    if (y < this.clipMinY || y >= this.clipMaxY) {
      return;
    }
    if (x < this.clipMinX) {
      width -= this.clipMinX - x;
      x = this.clipMinX;
    }
    if (x + width > this.clipMaxX) {
      width = this.clipMaxX - x;
    }
    const off = x + y * this.width;
    for (let i = 0;i < width; i++) {
      this.pixels[off + i] = rgb;
    }
  }
  static vline(x, y, rgb, height) {
    if (x < this.clipMinX || x >= this.clipMaxX) {
      return;
    }
    if (y < this.clipMinY) {
      height -= this.clipMinY - y;
      y = this.clipMinY;
    }
    if (y + height > this.clipMaxY) {
      height = this.clipMaxY - y;
    }
    const off = x + y * this.width;
    for (let i = 0;i < height; i++) {
      this.pixels[off + i * this.width] = rgb;
    }
  }
  static fillCircle(xCenter, yCenter, yRadius, rgb, alpha) {
    const invAlpha = 256 - alpha;
    const r0 = (rgb >> 16 & 255) * alpha;
    const g0 = (rgb >> 8 & 255) * alpha;
    const b0 = (rgb & 255) * alpha;
    let yStart = yCenter - yRadius;
    if (yStart < 0) {
      yStart = 0;
    }
    let yEnd = yCenter + yRadius;
    if (yEnd >= this.height) {
      yEnd = this.height - 1;
    }
    for (let y = yStart;y <= yEnd; y++) {
      const midpoint = y - yCenter;
      const xRadius = Math.sqrt(yRadius * yRadius - midpoint * midpoint) | 0;
      let xStart = xCenter - xRadius;
      if (xStart < 0) {
        xStart = 0;
      }
      let xEnd = xCenter + xRadius;
      if (xEnd >= this.width) {
        xEnd = this.width - 1;
      }
      let offset = xStart + y * this.width;
      for (let x = xStart;x <= xEnd; x++) {
        const r1 = (this.pixels[offset] >> 16 & 255) * invAlpha;
        const g1 = (this.pixels[offset] >> 8 & 255) * invAlpha;
        const b1 = (this.pixels[offset] & 255) * invAlpha;
        const mixed = (r0 + r1 >> 8 << 16) + (g0 + g1 >> 8 << 8) + (b0 + b1 >> 8);
        this.pixels[offset++] = mixed;
      }
    }
  }
}

// src/graphics/Pix8.ts
class Pix8 extends Linkable2 {
  data;
  bpal;
  wi;
  hi;
  xof;
  yof;
  owi;
  ohi;
  constructor(width, height, palette) {
    super();
    this.data = new Int8Array(width * height);
    this.wi = this.owi = width;
    this.hi = this.ohi = height;
    this.xof = this.yof = 0;
    this.bpal = palette;
  }
  static depack(jag, name, sprite = 0) {
    const dat = new Packet(jag.read(name + ".dat"));
    const index = new Packet(jag.read("index.dat"));
    index.pos = dat.g2();
    const owi = index.g2();
    const ohi = index.g2();
    const bpalCount = index.g1();
    const bpal = new Int32Array(bpalCount);
    for (let i = 0;i < bpalCount - 1; i++) {
      bpal[i + 1] = index.g3();
    }
    for (let i = 0;i < sprite; i++) {
      index.pos += 2;
      dat.pos += index.g2() * index.g2();
      index.pos += 1;
    }
    if (dat.pos > dat.length || index.pos > index.length) {
      throw new Error;
    }
    const xof = index.g1();
    const yof = index.g1();
    const wi = index.g2();
    const hi = index.g2();
    const image = new Pix8(wi, hi, bpal);
    image.xof = xof;
    image.yof = yof;
    image.owi = owi;
    image.ohi = ohi;
    const encoding = index.g1();
    if (encoding === 0) {
      for (let i = 0;i < image.wi * image.hi; i++) {
        image.data[i] = dat.g1b();
      }
    } else if (encoding === 1) {
      for (let x = 0;x < image.wi; x++) {
        for (let y = 0;y < image.hi; y++) {
          image.data[x + y * image.wi] = dat.g1b();
        }
      }
    }
    return image;
  }
  halveSize() {
    this.owi |= 0;
    this.ohi |= 0;
    this.owi /= 2;
    this.ohi /= 2;
    this.owi |= 0;
    this.ohi |= 0;
    const pixels = new Int8Array(this.owi * this.ohi);
    let off = 0;
    for (let y = 0;y < this.hi; y++) {
      for (let x = 0;x < this.wi; x++) {
        pixels[(x + this.xof >> 1) + (y + this.yof >> 1) * this.owi] = this.data[off++];
      }
    }
    this.data = pixels;
    this.wi = this.owi;
    this.hi = this.ohi;
    this.xof = 0;
    this.yof = 0;
  }
  trim() {
    if (this.wi === this.owi && this.hi === this.ohi) {
      return;
    }
    const pixels = new Int8Array(this.owi * this.ohi);
    let off = 0;
    for (let y = 0;y < this.hi; y++) {
      for (let x = 0;x < this.wi; x++) {
        pixels[x + this.xof + (y + this.yof) * this.owi] = this.data[off++];
      }
    }
    this.data = pixels;
    this.wi = this.owi;
    this.hi = this.ohi;
    this.xof = 0;
    this.yof = 0;
  }
  rgbAdjust(r, g, b) {
    for (let i = 0;i < this.bpal.length; i++) {
      let red = this.bpal[i] >> 16 & 255;
      red += r;
      if (red < 0) {
        red = 0;
      } else if (red > 255) {
        red = 255;
      }
      let green = this.bpal[i] >> 8 & 255;
      green += g;
      if (green < 0) {
        green = 0;
      } else if (green > 255) {
        green = 255;
      }
      let blue = this.bpal[i] & 255;
      blue += b;
      if (blue < 0) {
        blue = 0;
      } else if (blue > 255) {
        blue = 255;
      }
      this.bpal[i] = (red << 16) + (green << 8) + blue;
    }
  }
  hflip() {
    const pixels = this.data;
    const width = this.wi;
    const height = this.hi;
    for (let y = 0;y < height; y++) {
      const div = width / 2 | 0;
      for (let x = 0;x < div; x++) {
        const off1 = x + y * width;
        const off2 = width - x - 1 + y * width;
        const tmp = pixels[off1];
        pixels[off1] = pixels[off2];
        pixels[off2] = tmp;
      }
    }
  }
  vflip() {
    const pixels = this.data;
    const width = this.wi;
    const height = this.hi;
    for (let y = 0;y < (height / 2 | 0); y++) {
      for (let x = 0;x < width; x++) {
        const off1 = x + y * width;
        const off2 = x + (height - y - 1) * width;
        const tmp = pixels[off1];
        pixels[off1] = pixels[off2];
        pixels[off2] = tmp;
      }
    }
  }
  plotSprite(x, y) {
    x |= 0;
    y |= 0;
    x += this.xof;
    y += this.yof;
    let dstOff = x + y * Pix2D.width;
    let srcOff = 0;
    let h = this.hi;
    let w = this.wi;
    let dstStep = Pix2D.width - w;
    let srcStep = 0;
    if (y < Pix2D.clipMinY) {
      const cutoff = Pix2D.clipMinY - y;
      h -= cutoff;
      y = Pix2D.clipMinY;
      srcOff += cutoff * w;
      dstOff += cutoff * Pix2D.width;
    }
    if (y + h > Pix2D.clipMaxY) {
      h -= y + h - Pix2D.clipMaxY;
    }
    if (x < Pix2D.clipMinX) {
      const cutoff = Pix2D.clipMinX - x;
      w -= cutoff;
      x = Pix2D.clipMinX;
      srcOff += cutoff;
      dstOff += cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }
    if (x + w > Pix2D.clipMaxX) {
      const cutoff = x + w - Pix2D.clipMaxX;
      w -= cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }
    if (w > 0 && h > 0) {
      this.plot(w, h, this.data, srcOff, srcStep, Pix2D.pixels, dstOff, dstStep);
    }
  }
  plot(w, h, src, srcOff, srcStep, dst, dstOff, dstStep) {
    const qw = -(w >> 2);
    w = -(w & 3);
    for (let y = -h;y < 0; y++) {
      for (let x = qw;x < 0; x++) {
        let palIndex = src[srcOff++];
        if (palIndex === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = this.bpal[palIndex & 255];
        }
        palIndex = src[srcOff++];
        if (palIndex === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = this.bpal[palIndex & 255];
        }
        palIndex = src[srcOff++];
        if (palIndex === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = this.bpal[palIndex & 255];
        }
        palIndex = src[srcOff++];
        if (palIndex === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = this.bpal[palIndex & 255];
        }
      }
      for (let x = w;x < 0; x++) {
        const palIndex = src[srcOff++];
        if (palIndex === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = this.bpal[palIndex & 255];
        }
      }
      dstOff += dstStep;
      srcOff += srcStep;
    }
  }
  scalePlotSprite(arg0, arg1, arg2, arg3) {
    try {
      const local2 = this.wi;
      const local5 = this.hi;
      let local7 = 0;
      let local9 = 0;
      const _local15 = (local2 << 16) / arg2 | 0;
      const _local21 = (local5 << 16) / arg3 | 0;
      const local24 = this.owi;
      const local27 = this.ohi;
      const local33 = (local24 << 16) / arg2 | 0;
      const local39 = (local27 << 16) / arg3 | 0;
      arg0 = arg0 + (this.xof * arg2 + local24 - 1) / local24 | 0;
      arg1 = arg1 + (this.yof * arg3 + local27 - 1) / local27 | 0;
      if (this.xof * arg2 % local24 != 0) {
        local7 = (local24 - this.xof * arg2 % local24 << 16) / arg2 | 0;
      }
      if (this.yof * arg3 % local27 != 0) {
        local9 = (local27 - this.yof * arg3 % local27 << 16) / arg3 | 0;
      }
      arg2 = arg2 * (this.wi - (local7 >> 16)) / local24 | 0;
      arg3 = arg3 * (this.hi - (local9 >> 16)) / local27 | 0;
      let local133 = arg0 + arg1 * Pix2D.width;
      let local137 = Pix2D.width - arg2;
      let local144;
      if (arg1 < Pix2D.clipMinY) {
        local144 = Pix2D.clipMinY - arg1;
        arg3 -= local144;
        arg1 = 0;
        local133 += local144 * Pix2D.width;
        local9 += local39 * local144;
      }
      if (arg1 + arg3 > Pix2D.clipMaxY) {
        arg3 -= arg1 + arg3 - Pix2D.clipMaxY;
      }
      if (arg0 < Pix2D.clipMinX) {
        local144 = Pix2D.clipMinX - arg0;
        arg2 -= local144;
        arg0 = 0;
        local133 += local144;
        local7 += local33 * local144;
        local137 += local144;
      }
      if (arg0 + arg2 > Pix2D.clipMaxX) {
        local144 = arg0 + arg2 - Pix2D.clipMaxX;
        arg2 -= local144;
        local137 += local144;
      }
      this.plotScale(Pix2D.pixels, this.data, this.bpal, local7, local9, local133, local137, arg2, arg3, local33, local39, local2);
    } catch (_e) {
      console.log("error in sprite clipping routine");
    }
  }
  plotScale(dst, src, bpal, offW, offH, dstOff, dstStep, w, h, scaleCropWidth, scaleCropHeight, arg11) {
    try {
      const lastOffW = offW;
      for (let y = -h;y < 0; y++) {
        const offY = (offH >> 16) * arg11;
        for (let x = -w;x < 0; x++) {
          const rgb = src[(offW >> 16) + offY];
          if (rgb == 0) {
            dstOff++;
          } else {
            dst[dstOff++] = bpal[rgb & 255];
          }
          offW += scaleCropWidth;
        }
        offH += scaleCropHeight;
        offW = lastOffW;
        dstOff += dstStep;
      }
    } catch (_e) {
      console.log("error in plot_scale");
    }
  }
}

// src/util/Arrays.ts
class TypedArray1d extends Array {
  constructor(length, defaultValue) {
    super(length);
    for (let l = 0;l < length; l++) {
      this[l] = defaultValue;
    }
  }
}

class TypedArray2d extends Array {
  constructor(length, width, defaultValue) {
    super(length);
    for (let l = 0;l < length; l++) {
      this[l] = new Array(width);
      for (let w = 0;w < width; w++) {
        this[l][w] = defaultValue;
      }
    }
  }
}

class TypedArray3d extends Array {
  constructor(length, width, height, defaultValue) {
    super(length);
    for (let l = 0;l < length; l++) {
      this[l] = new Array(width);
      for (let w = 0;w < width; w++) {
        this[l][w] = new Array(height);
        for (let h = 0;h < height; h++) {
          this[l][w][h] = defaultValue;
        }
      }
    }
  }
}

class TypedArray4d extends Array {
  constructor(length, width, height, space, defaultValue) {
    super(length);
    for (let l = 0;l < length; l++) {
      this[l] = new Array(width);
      for (let w = 0;w < width; w++) {
        this[l][w] = new Array(height);
        for (let h = 0;h < height; h++) {
          this[l][w][h] = new Array(space);
          for (let s = 0;s < space; s++) {
            this[l][w][h][s] = defaultValue;
          }
        }
      }
    }
  }
}

class Uint8Array3d extends Array {
  constructor(length, width, height) {
    super(length);
    for (let l = 0;l < length; l++) {
      this[l] = new Array(width);
      for (let w = 0;w < width; w++) {
        this[l][w] = new Uint8Array(height);
      }
    }
  }
}

class Int32Array2d extends Array {
  constructor(length, width) {
    super(length);
    for (let l = 0;l < length; l++) {
      this[l] = new Int32Array(width);
    }
  }
}

class Int32Array3d extends Array {
  constructor(length, width, height) {
    super(length);
    for (let l = 0;l < length; l++) {
      this[l] = new Array(width);
      for (let w = 0;w < width; w++) {
        this[l][w] = new Int32Array(height);
      }
    }
  }
}

// src/dash3d/Pix3D.ts
class Pix3D extends Pix2D {
  static lowMem = false;
  static lowDetail = true;
  static divTable = new Int32Array(512);
  static divTable2 = new Int32Array(2048);
  static sinTable = new Int32Array(2048);
  static cosTable = new Int32Array(2048);
  static colourTable = new Int32Array(65536);
  static textures = new TypedArray1d(50, null);
  static texTrans = new TypedArray1d(50, false);
  static texAverage = new Int32Array(50);
  static activeTexels = new TypedArray1d(50, null);
  static texCycle = new Int32Array(50);
  static texPal = new TypedArray1d(50, null);
  static numTextures = 0;
  static originX = 0;
  static originY = 0;
  static texelPool = null;
  static poolSize = 0;
  static opaque = false;
  static cycle = 0;
  static scanline = new Int32Array;
  static hclip = false;
  static trans = 0;
  static {
    for (let i = 1;i < 512; i++) {
      this.divTable[i] = 32768 / i | 0;
    }
    for (let i = 1;i < 2048; i++) {
      this.divTable2[i] = 65536 / i | 0;
    }
    for (let i = 0;i < 2048; i++) {
      this.sinTable[i] = Math.sin(i * 0.0030679615757712823) * 65536 | 0;
      this.cosTable[i] = Math.cos(i * 0.0030679615757712823) * 65536 | 0;
    }
  }
  static setRenderClipping() {
    this.scanline = new Int32Array(Pix2D.height);
    for (let y = 0;y < Pix2D.height; y++) {
      this.scanline[y] = Pix2D.width * y;
    }
    this.originX = Pix2D.width / 2 | 0;
    this.originY = Pix2D.height / 2 | 0;
  }
  static setClipping(width, height) {
    this.scanline = new Int32Array(height);
    for (let y = 0;y < height; y++) {
      this.scanline[y] = width * y;
    }
    this.originX = width / 2 | 0;
    this.originY = height / 2 | 0;
  }
  static clearTexels() {
    this.texelPool = null;
    this.activeTexels.fill(null);
  }
  static initPool(size) {
    if (this.texelPool) {
      return;
    }
    this.poolSize = size;
    if (this.lowMem) {
      this.texelPool = new Int32Array2d(size, 16384);
    } else {
      this.texelPool = new Int32Array2d(size, 65536);
    }
    this.activeTexels.fill(null);
  }
  static unpackTextures(textures) {
    this.numTextures = 0;
    for (let i = 0;i < 50; i++) {
      try {
        this.textures[i] = Pix8.depack(textures, i.toString());
        if (this.lowMem && this.textures[i]?.owi === 128) {
          this.textures[i]?.halveSize();
        } else {
          this.textures[i]?.trim();
        }
        this.numTextures++;
      } catch (_e) {}
    }
  }
  static getTextureAverage(id) {
    if (this.texAverage[id] !== 0) {
      return this.texAverage[id];
    }
    const palette = this.texPal[id];
    if (!palette) {
      return 0;
    }
    let r = 0;
    let g = 0;
    let b = 0;
    const length = palette.length;
    for (let i = 0;i < length; i++) {
      r += palette[i] >> 16 & 255;
      g += palette[i] >> 8 & 255;
      b += palette[i] & 255;
    }
    let rgb = ((r / length | 0) << 16) + ((g / length | 0) << 8) + (b / length | 0);
    rgb = this.gammaCorrect(rgb, 1.4);
    if (rgb === 0) {
      rgb = 1;
    }
    this.texAverage[id] = rgb;
    return rgb;
  }
  static pushTexture(id) {
    if (this.activeTexels[id] && this.texelPool) {
      this.texelPool[this.poolSize++] = this.activeTexels[id];
      this.activeTexels[id] = null;
    }
  }
  static getTexels(id) {
    this.texCycle[id] = this.cycle++;
    if (this.activeTexels[id]) {
      return this.activeTexels[id];
    }
    let texels;
    if (this.poolSize > 0 && this.texelPool) {
      texels = this.texelPool[--this.poolSize];
      this.texelPool[this.poolSize] = null;
    } else {
      let cycle = 0;
      let selected = -1;
      for (let t = 0;t < this.numTextures; t++) {
        if (this.activeTexels[t] && (this.texCycle[t] < cycle || selected === -1)) {
          cycle = this.texCycle[t];
          selected = t;
        }
      }
      texels = this.activeTexels[selected];
      this.activeTexels[selected] = null;
    }
    this.activeTexels[id] = texels;
    const texture = this.textures[id];
    const palette = this.texPal[id];
    if (!texels || !texture || !palette) {
      return null;
    }
    if (this.lowMem) {
      this.texTrans[id] = false;
      for (let i = 0;i < 4096; i++) {
        const rgb = texels[i] = palette[texture.data[i]] & 16316671;
        if (rgb === 0) {
          this.texTrans[id] = true;
        }
        texels[i + 4096] = rgb - (rgb >>> 3) & 16316671;
        texels[i + 8192] = rgb - (rgb >>> 2) & 16316671;
        texels[i + 12288] = rgb - (rgb >>> 2) - (rgb >>> 3) & 16316671;
      }
    } else {
      if (texture.wi === 64) {
        for (let y = 0;y < 128; y++) {
          for (let x = 0;x < 128; x++) {
            texels[x + (y << 7 | 0)] = palette[texture.data[(x >> 1) + (y >> 1 << 6 | 0)]];
          }
        }
      } else {
        for (let i = 0;i < 16384; i++) {
          texels[i] = palette[texture.data[i]];
        }
      }
      this.texTrans[id] = false;
      for (let i = 0;i < 16384; i++) {
        texels[i] &= 16316671;
        const rgb = texels[i];
        if (rgb === 0) {
          this.texTrans[id] = true;
        }
        texels[i + 16384] = rgb - (rgb >>> 3) & 16316671;
        texels[i + 32768] = rgb - (rgb >>> 2) & 16316671;
        texels[i + 49152] = rgb - (rgb >>> 2) - (rgb >>> 3) & 16316671;
      }
    }
    return texels;
  }
  static initColourTable(brightness) {
    const randomBrightness = brightness + Math.random() * 0.03 - 0.015;
    let offset = 0;
    for (let y = 0;y < 512; y++) {
      const hue = (y / 8 | 0) / 64 + 0.0078125;
      const saturation = (y & 7) / 8 + 0.0625;
      for (let x = 0;x < 128; x++) {
        const lightness = x / 128;
        let r = lightness;
        let g = lightness;
        let b = lightness;
        if (saturation !== 0) {
          let q;
          if (lightness < 0.5) {
            q = lightness * (saturation + 1);
          } else {
            q = lightness + saturation - lightness * saturation;
          }
          const p = lightness * 2 - q;
          let t = hue + 0.3333333333333333;
          if (t > 1) {
            t--;
          }
          let d11 = hue - 0.3333333333333333;
          if (d11 < 0) {
            d11++;
          }
          if (t * 6 < 1) {
            r = p + (q - p) * 6 * t;
          } else if (t * 2 < 1) {
            r = q;
          } else if (t * 3 < 2) {
            r = p + (q - p) * (0.6666666666666666 - t) * 6;
          } else {
            r = p;
          }
          if (hue * 6 < 1) {
            g = p + (q - p) * 6 * hue;
          } else if (hue * 2 < 1) {
            g = q;
          } else if (hue * 3 < 2) {
            g = p + (q - p) * (0.6666666666666666 - hue) * 6;
          } else {
            g = p;
          }
          if (d11 * 6 < 1) {
            b = p + (q - p) * 6 * d11;
          } else if (d11 * 2 < 1) {
            b = q;
          } else if (d11 * 3 < 2) {
            b = p + (q - p) * (0.6666666666666666 - d11) * 6;
          } else {
            b = p;
          }
        }
        const intR = r * 256 | 0;
        const intG = g * 256 | 0;
        const intB = b * 256 | 0;
        const rgb = (intR << 16) + (intG << 8) + intB;
        this.colourTable[offset++] = this.gammaCorrect(rgb, randomBrightness);
      }
    }
    for (let id = 0;id < 50; id++) {
      const texture = this.textures[id];
      if (!texture) {
        continue;
      }
      const palette = texture.bpal;
      this.texPal[id] = new Int32Array(palette.length);
      for (let i = 0;i < palette.length; i++) {
        const texturePalette = this.texPal[id];
        if (!texturePalette) {
          continue;
        }
        texturePalette[i] = this.gammaCorrect(palette[i], randomBrightness);
      }
    }
    for (let id = 0;id < 50; id++) {
      this.pushTexture(id);
    }
  }
  static gammaCorrect(rgb, gamma) {
    const r = (rgb >> 16) / 256;
    const g = (rgb >> 8 & 255) / 256;
    const b = (rgb & 255) / 256;
    const powR = Math.pow(r, gamma);
    const powG = Math.pow(g, gamma);
    const powB = Math.pow(b, gamma);
    const intR = powR * 256 | 0;
    const intG = powG * 256 | 0;
    const intB = powB * 256 | 0;
    return (intR << 16) + (intG << 8) + intB;
  }
  static gouraudTriangle(xA, xB, xC, yA, yB, yC, colourA, colourB, colourC) {
    let xStepAB = 0;
    let colourStepAB = 0;
    if (yB !== yA) {
      xStepAB = (xB - xA << 16) / (yB - yA) | 0;
      colourStepAB = (colourB - colourA << 15) / (yB - yA) | 0;
    }
    let xStepBC = 0;
    let colourStepBC = 0;
    if (yC !== yB) {
      xStepBC = (xC - xB << 16) / (yC - yB) | 0;
      colourStepBC = (colourC - colourB << 15) / (yC - yB) | 0;
    }
    let xStepAC = 0;
    let colourStepAC = 0;
    if (yC !== yA) {
      xStepAC = (xA - xC << 16) / (yA - yC) | 0;
      colourStepAC = (colourA - colourC << 15) / (yA - yC) | 0;
    }
    if (yA <= yB && yA <= yC) {
      if (yA >= Pix2D.clipMaxY) {
        return;
      }
      if (yB > Pix2D.clipMaxY) {
        yB = Pix2D.clipMaxY;
      }
      if (yC > Pix2D.clipMaxY) {
        yC = Pix2D.clipMaxY;
      }
      if (yB < yC) {
        xC = xA <<= 16;
        colourC = colourA <<= 15;
        if (yA < 0) {
          xC -= xStepAC * yA;
          xA -= xStepAB * yA;
          colourC -= colourStepAC * yA;
          colourA -= colourStepAB * yA;
          yA = 0;
        }
        xB <<= 16;
        colourB <<= 15;
        if (yB < 0) {
          xB -= xStepBC * yB;
          colourB -= colourStepBC * yB;
          yB = 0;
        }
        if (yA !== yB && xStepAC < xStepAB || yA === yB && xStepAC > xStepBC) {
          yC -= yB;
          yB -= yA;
          yA = this.scanline[yA];
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.gouraudRaster(xC >> 16, xB >> 16, colourC >> 7, colourB >> 7, Pix2D.pixels, yA, 0);
                xC += xStepAC;
                xB += xStepBC;
                colourC += colourStepAC;
                colourB += colourStepBC;
                yA += Pix2D.width;
              }
            }
            this.gouraudRaster(xC >> 16, xA >> 16, colourC >> 7, colourA >> 7, Pix2D.pixels, yA, 0);
            xC += xStepAC;
            xA += xStepAB;
            colourC += colourStepAC;
            colourA += colourStepAB;
            yA += Pix2D.width;
          }
        } else {
          yC -= yB;
          yB -= yA;
          yA = this.scanline[yA];
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.gouraudRaster(xB >> 16, xC >> 16, colourB >> 7, colourC >> 7, Pix2D.pixels, yA, 0);
                xC += xStepAC;
                xB += xStepBC;
                colourC += colourStepAC;
                colourB += colourStepBC;
                yA += Pix2D.width;
              }
            }
            this.gouraudRaster(xA >> 16, xC >> 16, colourA >> 7, colourC >> 7, Pix2D.pixels, yA, 0);
            xC += xStepAC;
            xA += xStepAB;
            colourC += colourStepAC;
            colourA += colourStepAB;
            yA += Pix2D.width;
          }
        }
      } else {
        xB = xA <<= 16;
        colourB = colourA <<= 15;
        if (yA < 0) {
          xB -= xStepAC * yA;
          xA -= xStepAB * yA;
          colourB -= colourStepAC * yA;
          colourA -= colourStepAB * yA;
          yA = 0;
        }
        xC <<= 16;
        colourC <<= 15;
        if (yC < 0) {
          xC -= xStepBC * yC;
          colourC -= colourStepBC * yC;
          yC = 0;
        }
        if (yA !== yC && xStepAC < xStepAB || yA === yC && xStepBC > xStepAB) {
          yB -= yC;
          yC -= yA;
          yA = this.scanline[yA];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.gouraudRaster(xC >> 16, xA >> 16, colourC >> 7, colourA >> 7, Pix2D.pixels, yA, 0);
                xC += xStepBC;
                xA += xStepAB;
                colourC += colourStepBC;
                colourA += colourStepAB;
                yA += Pix2D.width;
              }
            }
            this.gouraudRaster(xB >> 16, xA >> 16, colourB >> 7, colourA >> 7, Pix2D.pixels, yA, 0);
            xB += xStepAC;
            xA += xStepAB;
            colourB += colourStepAC;
            colourA += colourStepAB;
            yA += Pix2D.width;
          }
        } else {
          yB -= yC;
          yC -= yA;
          yA = this.scanline[yA];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.gouraudRaster(xA >> 16, xC >> 16, colourA >> 7, colourC >> 7, Pix2D.pixels, yA, 0);
                xC += xStepBC;
                xA += xStepAB;
                colourC += colourStepBC;
                colourA += colourStepAB;
                yA += Pix2D.width;
              }
            }
            this.gouraudRaster(xA >> 16, xB >> 16, colourA >> 7, colourB >> 7, Pix2D.pixels, yA, 0);
            xB += xStepAC;
            xA += xStepAB;
            colourB += colourStepAC;
            colourA += colourStepAB;
            yA += Pix2D.width;
          }
        }
      }
    } else if (yB <= yC) {
      if (yB >= Pix2D.clipMaxY) {
        return;
      }
      if (yC > Pix2D.clipMaxY) {
        yC = Pix2D.clipMaxY;
      }
      if (yA > Pix2D.clipMaxY) {
        yA = Pix2D.clipMaxY;
      }
      if (yC < yA) {
        xA = xB <<= 16;
        colourA = colourB <<= 15;
        if (yB < 0) {
          xA -= xStepAB * yB;
          xB -= xStepBC * yB;
          colourA -= colourStepAB * yB;
          colourB -= colourStepBC * yB;
          yB = 0;
        }
        xC <<= 16;
        colourC <<= 15;
        if (yC < 0) {
          xC -= xStepAC * yC;
          colourC -= colourStepAC * yC;
          yC = 0;
        }
        if (yB !== yC && xStepAB < xStepBC || yB === yC && xStepAB > xStepAC) {
          yA -= yC;
          yC -= yB;
          yB = this.scanline[yB];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.gouraudRaster(xA >> 16, xC >> 16, colourA >> 7, colourC >> 7, Pix2D.pixels, yB, 0);
                xA += xStepAB;
                xC += xStepAC;
                colourA += colourStepAB;
                colourC += colourStepAC;
                yB += Pix2D.width;
              }
            }
            this.gouraudRaster(xA >> 16, xB >> 16, colourA >> 7, colourB >> 7, Pix2D.pixels, yB, 0);
            xA += xStepAB;
            xB += xStepBC;
            colourA += colourStepAB;
            colourB += colourStepBC;
            yB += Pix2D.width;
          }
        } else {
          yA -= yC;
          yC -= yB;
          yB = this.scanline[yB];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.gouraudRaster(xC >> 16, xA >> 16, colourC >> 7, colourA >> 7, Pix2D.pixels, yB, 0);
                xA += xStepAB;
                xC += xStepAC;
                colourA += colourStepAB;
                colourC += colourStepAC;
                yB += Pix2D.width;
              }
            }
            this.gouraudRaster(xB >> 16, xA >> 16, colourB >> 7, colourA >> 7, Pix2D.pixels, yB, 0);
            xA += xStepAB;
            xB += xStepBC;
            colourA += colourStepAB;
            colourB += colourStepBC;
            yB += Pix2D.width;
          }
        }
      } else {
        xC = xB <<= 16;
        colourC = colourB <<= 15;
        if (yB < 0) {
          xC -= xStepAB * yB;
          xB -= xStepBC * yB;
          colourC -= colourStepAB * yB;
          colourB -= colourStepBC * yB;
          yB = 0;
        }
        xA <<= 16;
        colourA <<= 15;
        if (yA < 0) {
          xA -= xStepAC * yA;
          colourA -= colourStepAC * yA;
          yA = 0;
        }
        yC -= yA;
        yA -= yB;
        yB = this.scanline[yB];
        if (xStepAB < xStepBC) {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.gouraudRaster(xA >> 16, xB >> 16, colourA >> 7, colourB >> 7, Pix2D.pixels, yB, 0);
                xA += xStepAC;
                xB += xStepBC;
                colourA += colourStepAC;
                colourB += colourStepBC;
                yB += Pix2D.width;
              }
            }
            this.gouraudRaster(xC >> 16, xB >> 16, colourC >> 7, colourB >> 7, Pix2D.pixels, yB, 0);
            xC += xStepAB;
            xB += xStepBC;
            colourC += colourStepAB;
            colourB += colourStepBC;
            yB += Pix2D.width;
          }
        } else {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.gouraudRaster(xB >> 16, xA >> 16, colourB >> 7, colourA >> 7, Pix2D.pixels, yB, 0);
                xA += xStepAC;
                xB += xStepBC;
                colourA += colourStepAC;
                colourB += colourStepBC;
                yB += Pix2D.width;
              }
            }
            this.gouraudRaster(xB >> 16, xC >> 16, colourB >> 7, colourC >> 7, Pix2D.pixels, yB, 0);
            xC += xStepAB;
            xB += xStepBC;
            colourC += colourStepAB;
            colourB += colourStepBC;
            yB += Pix2D.width;
          }
        }
      }
    } else {
      if (yC >= Pix2D.clipMaxY) {
        return;
      }
      if (yA > Pix2D.clipMaxY) {
        yA = Pix2D.clipMaxY;
      }
      if (yB > Pix2D.clipMaxY) {
        yB = Pix2D.clipMaxY;
      }
      if (yA < yB) {
        xB = xC <<= 16;
        colourB = colourC <<= 15;
        if (yC < 0) {
          xB -= xStepBC * yC;
          xC -= xStepAC * yC;
          colourB -= colourStepBC * yC;
          colourC -= colourStepAC * yC;
          yC = 0;
        }
        xA <<= 16;
        colourA <<= 15;
        if (yA < 0) {
          xA -= xStepAB * yA;
          colourA -= colourStepAB * yA;
          yA = 0;
        }
        yB -= yA;
        yA -= yC;
        yC = this.scanline[yC];
        if (xStepBC < xStepAC) {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.gouraudRaster(xB >> 16, xA >> 16, colourB >> 7, colourA >> 7, Pix2D.pixels, yC, 0);
                xB += xStepBC;
                xA += xStepAB;
                colourB += colourStepBC;
                colourA += colourStepAB;
                yC += Pix2D.width;
              }
            }
            this.gouraudRaster(xB >> 16, xC >> 16, colourB >> 7, colourC >> 7, Pix2D.pixels, yC, 0);
            xB += xStepBC;
            xC += xStepAC;
            colourB += colourStepBC;
            colourC += colourStepAC;
            yC += Pix2D.width;
          }
        } else {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.gouraudRaster(xA >> 16, xB >> 16, colourA >> 7, colourB >> 7, Pix2D.pixels, yC, 0);
                xB += xStepBC;
                xA += xStepAB;
                colourB += colourStepBC;
                colourA += colourStepAB;
                yC += Pix2D.width;
              }
            }
            this.gouraudRaster(xC >> 16, xB >> 16, colourC >> 7, colourB >> 7, Pix2D.pixels, yC, 0);
            xB += xStepBC;
            xC += xStepAC;
            colourB += colourStepBC;
            colourC += colourStepAC;
            yC += Pix2D.width;
          }
        }
      } else {
        xA = xC <<= 16;
        colourA = colourC <<= 15;
        if (yC < 0) {
          xA -= xStepBC * yC;
          xC -= xStepAC * yC;
          colourA -= colourStepBC * yC;
          colourC -= colourStepAC * yC;
          yC = 0;
        }
        xB <<= 16;
        colourB <<= 15;
        if (yB < 0) {
          xB -= xStepAB * yB;
          colourB -= colourStepAB * yB;
          yB = 0;
        }
        yA -= yB;
        yB -= yC;
        yC = this.scanline[yC];
        if (xStepBC < xStepAC) {
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.gouraudRaster(xB >> 16, xC >> 16, colourB >> 7, colourC >> 7, Pix2D.pixels, yC, 0);
                xB += xStepAB;
                xC += xStepAC;
                colourB += colourStepAB;
                colourC += colourStepAC;
                yC += Pix2D.width;
              }
            }
            this.gouraudRaster(xA >> 16, xC >> 16, colourA >> 7, colourC >> 7, Pix2D.pixels, yC, 0);
            xA += xStepBC;
            xC += xStepAC;
            colourA += colourStepBC;
            colourC += colourStepAC;
            yC += Pix2D.width;
          }
        } else {
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.gouraudRaster(xC >> 16, xB >> 16, colourC >> 7, colourB >> 7, Pix2D.pixels, yC, 0);
                xB += xStepAB;
                xC += xStepAC;
                colourB += colourStepAB;
                colourC += colourStepAC;
                yC += Pix2D.width;
              }
            }
            this.gouraudRaster(xC >> 16, xA >> 16, colourC >> 7, colourA >> 7, Pix2D.pixels, yC, 0);
            xA += xStepBC;
            xC += xStepAC;
            colourA += colourStepBC;
            colourC += colourStepAC;
            yC += Pix2D.width;
          }
        }
      }
    }
  }
  static gouraudRaster(xA, xB, colourA, colourB, dst, off, len) {
    let rgb;
    if (this.lowDetail) {
      let colourStep;
      if (this.hclip) {
        if (xB - xA > 3) {
          colourStep = (colourB - colourA) / (xB - xA) | 0;
        } else {
          colourStep = 0;
        }
        if (xB > Pix2D.sizeX) {
          xB = Pix2D.sizeX;
        }
        if (xA < 0) {
          colourA -= xA * colourStep;
          xA = 0;
        }
        if (xA >= xB) {
          return;
        }
        off += xA;
        len = xB - xA >> 2;
        colourStep <<= 2;
      } else if (xA < xB) {
        off += xA;
        len = xB - xA >> 2;
        if (len > 0) {
          colourStep = (colourB - colourA) * this.divTable[len] >> 15;
        } else {
          colourStep = 0;
        }
      } else {
        return;
      }
      if (this.trans === 0) {
        while (true) {
          len--;
          if (len < 0) {
            len = xB - xA & 3;
            if (len > 0) {
              rgb = this.colourTable[colourA >> 8];
              do {
                dst[off++] = rgb;
                len--;
              } while (len > 0);
              return;
            }
            break;
          }
          rgb = this.colourTable[colourA >> 8];
          colourA += colourStep;
          dst[off++] = rgb;
          dst[off++] = rgb;
          dst[off++] = rgb;
          dst[off++] = rgb;
        }
      } else {
        const alpha = this.trans;
        const invAlpha = 256 - this.trans;
        while (true) {
          len--;
          if (len < 0) {
            len = xB - xA & 3;
            if (len > 0) {
              rgb = this.colourTable[colourA >> 8];
              rgb = ((rgb & 16711935) * invAlpha >> 8 & 16711935) + ((rgb & 65280) * invAlpha >> 8 & 65280);
              do {
                dst[off++] = rgb + ((dst[off] & 16711935) * alpha >> 8 & 16711935) + ((dst[off] & 65280) * alpha >> 8 & 65280);
                len--;
              } while (len > 0);
            }
            break;
          }
          rgb = this.colourTable[colourA >> 8];
          colourA += colourStep;
          rgb = ((rgb & 16711935) * invAlpha >> 8 & 16711935) + ((rgb & 65280) * invAlpha >> 8 & 65280);
          dst[off++] = rgb + ((dst[off] & 16711935) * alpha >> 8 & 16711935) + ((dst[off] & 65280) * alpha >> 8 & 65280);
          dst[off++] = rgb + ((dst[off] & 16711935) * alpha >> 8 & 16711935) + ((dst[off] & 65280) * alpha >> 8 & 65280);
          dst[off++] = rgb + ((dst[off] & 16711935) * alpha >> 8 & 16711935) + ((dst[off] & 65280) * alpha >> 8 & 65280);
          dst[off++] = rgb + ((dst[off] & 16711935) * alpha >> 8 & 16711935) + ((dst[off] & 65280) * alpha >> 8 & 65280);
        }
      }
    } else if (xA < xB) {
      const colourStep = (colourB - colourA) / (xB - xA) | 0;
      if (this.hclip) {
        if (xB > Pix2D.sizeX) {
          xB = Pix2D.sizeX;
        }
        if (xA < 0) {
          colourA -= xA * colourStep;
          xA = 0;
        }
        if (xA >= xB) {
          return;
        }
      }
      off += xA;
      len = xB - xA;
      if (this.trans === 0) {
        do {
          dst[off++] = this.colourTable[colourA >> 8];
          colourA += colourStep;
          len--;
        } while (len > 0);
      } else {
        const alpha = this.trans;
        const invAlpha = 256 - this.trans;
        do {
          rgb = this.colourTable[colourA >> 8];
          colourA += colourStep;
          rgb = ((rgb & 16711935) * invAlpha >> 8 & 16711935) + ((rgb & 65280) * invAlpha >> 8 & 65280);
          dst[off++] = rgb + ((dst[off] & 16711935) * alpha >> 8 & 16711935) + ((dst[off] & 65280) * alpha >> 8 & 65280);
          len--;
        } while (len > 0);
      }
    }
  }
  static flatTriangle(xA, xB, xC, yA, yB, yC, colour) {
    let xStepAB = 0;
    if (yB !== yA) {
      xStepAB = (xB - xA << 16) / (yB - yA) | 0;
    }
    let xStepBC = 0;
    if (yC !== yB) {
      xStepBC = (xC - xB << 16) / (yC - yB) | 0;
    }
    let xStepAC = 0;
    if (yC !== yA) {
      xStepAC = (xA - xC << 16) / (yA - yC) | 0;
    }
    if (yA <= yB && yA <= yC) {
      if (yA >= Pix2D.clipMaxY) {
        return;
      }
      if (yB > Pix2D.clipMaxY) {
        yB = Pix2D.clipMaxY;
      }
      if (yC > Pix2D.clipMaxY) {
        yC = Pix2D.clipMaxY;
      }
      if (yB < yC) {
        xC = xA <<= 16;
        if (yA < 0) {
          xC -= xStepAC * yA;
          xA -= xStepAB * yA;
          yA = 0;
        }
        xB <<= 16;
        if (yB < 0) {
          xB -= xStepBC * yB;
          yB = 0;
        }
        if (yA !== yB && xStepAC < xStepAB || yA === yB && xStepAC > xStepBC) {
          yC -= yB;
          yB -= yA;
          yA = this.scanline[yA];
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.flatRaster(xC >> 16, xB >> 16, Pix2D.pixels, yA, colour);
                xC += xStepAC;
                xB += xStepBC;
                yA += Pix2D.width;
              }
            }
            this.flatRaster(xC >> 16, xA >> 16, Pix2D.pixels, yA, colour);
            xC += xStepAC;
            xA += xStepAB;
            yA += Pix2D.width;
          }
        } else {
          yC -= yB;
          yB -= yA;
          yA = this.scanline[yA];
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.flatRaster(xB >> 16, xC >> 16, Pix2D.pixels, yA, colour);
                xC += xStepAC;
                xB += xStepBC;
                yA += Pix2D.width;
              }
            }
            this.flatRaster(xA >> 16, xC >> 16, Pix2D.pixels, yA, colour);
            xC += xStepAC;
            xA += xStepAB;
            yA += Pix2D.width;
          }
        }
      } else {
        xB = xA <<= 16;
        if (yA < 0) {
          xB -= xStepAC * yA;
          xA -= xStepAB * yA;
          yA = 0;
        }
        xC <<= 16;
        if (yC < 0) {
          xC -= xStepBC * yC;
          yC = 0;
        }
        if (yA !== yC && xStepAC < xStepAB || yA === yC && xStepBC > xStepAB) {
          yB -= yC;
          yC -= yA;
          yA = this.scanline[yA];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.flatRaster(xC >> 16, xA >> 16, Pix2D.pixels, yA, colour);
                xC += xStepBC;
                xA += xStepAB;
                yA += Pix2D.width;
              }
            }
            this.flatRaster(xB >> 16, xA >> 16, Pix2D.pixels, yA, colour);
            xB += xStepAC;
            xA += xStepAB;
            yA += Pix2D.width;
          }
        } else {
          yB -= yC;
          yC -= yA;
          yA = this.scanline[yA];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.flatRaster(xA >> 16, xC >> 16, Pix2D.pixels, yA, colour);
                xC += xStepBC;
                xA += xStepAB;
                yA += Pix2D.width;
              }
            }
            this.flatRaster(xA >> 16, xB >> 16, Pix2D.pixels, yA, colour);
            xB += xStepAC;
            xA += xStepAB;
            yA += Pix2D.width;
          }
        }
      }
    } else if (yB <= yC) {
      if (yB >= Pix2D.clipMaxY) {
        return;
      }
      if (yC > Pix2D.clipMaxY) {
        yC = Pix2D.clipMaxY;
      }
      if (yA > Pix2D.clipMaxY) {
        yA = Pix2D.clipMaxY;
      }
      if (yC < yA) {
        xA = xB <<= 16;
        if (yB < 0) {
          xA -= xStepAB * yB;
          xB -= xStepBC * yB;
          yB = 0;
        }
        xC <<= 16;
        if (yC < 0) {
          xC -= xStepAC * yC;
          yC = 0;
        }
        if (yB !== yC && xStepAB < xStepBC || yB === yC && xStepAB > xStepAC) {
          yA -= yC;
          yC -= yB;
          yB = this.scanline[yB];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.flatRaster(xA >> 16, xC >> 16, Pix2D.pixels, yB, colour);
                xA += xStepAB;
                xC += xStepAC;
                yB += Pix2D.width;
              }
            }
            this.flatRaster(xA >> 16, xB >> 16, Pix2D.pixels, yB, colour);
            xA += xStepAB;
            xB += xStepBC;
            yB += Pix2D.width;
          }
        } else {
          yA -= yC;
          yC -= yB;
          yB = this.scanline[yB];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.flatRaster(xC >> 16, xA >> 16, Pix2D.pixels, yB, colour);
                xA += xStepAB;
                xC += xStepAC;
                yB += Pix2D.width;
              }
            }
            this.flatRaster(xB >> 16, xA >> 16, Pix2D.pixels, yB, colour);
            xA += xStepAB;
            xB += xStepBC;
            yB += Pix2D.width;
          }
        }
      } else {
        xC = xB <<= 16;
        if (yB < 0) {
          xC -= xStepAB * yB;
          xB -= xStepBC * yB;
          yB = 0;
        }
        xA <<= 16;
        if (yA < 0) {
          xA -= xStepAC * yA;
          yA = 0;
        }
        yC -= yA;
        yA -= yB;
        yB = this.scanline[yB];
        if (xStepAB < xStepBC) {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.flatRaster(xA >> 16, xB >> 16, Pix2D.pixels, yB, colour);
                xA += xStepAC;
                xB += xStepBC;
                yB += Pix2D.width;
              }
            }
            this.flatRaster(xC >> 16, xB >> 16, Pix2D.pixels, yB, colour);
            xC += xStepAB;
            xB += xStepBC;
            yB += Pix2D.width;
          }
        } else {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.flatRaster(xB >> 16, xA >> 16, Pix2D.pixels, yB, colour);
                xA += xStepAC;
                xB += xStepBC;
                yB += Pix2D.width;
              }
            }
            this.flatRaster(xB >> 16, xC >> 16, Pix2D.pixels, yB, colour);
            xC += xStepAB;
            xB += xStepBC;
            yB += Pix2D.width;
          }
        }
      }
    } else {
      if (yC >= Pix2D.clipMaxY) {
        return;
      }
      if (yA > Pix2D.clipMaxY) {
        yA = Pix2D.clipMaxY;
      }
      if (yB > Pix2D.clipMaxY) {
        yB = Pix2D.clipMaxY;
      }
      if (yA < yB) {
        xB = xC <<= 16;
        if (yC < 0) {
          xB -= xStepBC * yC;
          xC -= xStepAC * yC;
          yC = 0;
        }
        xA <<= 16;
        if (yA < 0) {
          xA -= xStepAB * yA;
          yA = 0;
        }
        yB -= yA;
        yA -= yC;
        yC = this.scanline[yC];
        if (xStepBC < xStepAC) {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.flatRaster(xB >> 16, xA >> 16, Pix2D.pixels, yC, colour);
                xB += xStepBC;
                xA += xStepAB;
                yC += Pix2D.width;
              }
            }
            this.flatRaster(xB >> 16, xC >> 16, Pix2D.pixels, yC, colour);
            xB += xStepBC;
            xC += xStepAC;
            yC += Pix2D.width;
          }
        } else {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.flatRaster(xA >> 16, xB >> 16, Pix2D.pixels, yC, colour);
                xB += xStepBC;
                xA += xStepAB;
                yC += Pix2D.width;
              }
            }
            this.flatRaster(xC >> 16, xB >> 16, Pix2D.pixels, yC, colour);
            xB += xStepBC;
            xC += xStepAC;
            yC += Pix2D.width;
          }
        }
      } else {
        xA = xC <<= 16;
        if (yC < 0) {
          xA -= xStepBC * yC;
          xC -= xStepAC * yC;
          yC = 0;
        }
        xB <<= 16;
        if (yB < 0) {
          xB -= xStepAB * yB;
          yB = 0;
        }
        yA -= yB;
        yB -= yC;
        yC = this.scanline[yC];
        if (xStepBC < xStepAC) {
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.flatRaster(xB >> 16, xC >> 16, Pix2D.pixels, yC, colour);
                xB += xStepAB;
                xC += xStepAC;
                yC += Pix2D.width;
              }
            }
            this.flatRaster(xA >> 16, xC >> 16, Pix2D.pixels, yC, colour);
            xA += xStepBC;
            xC += xStepAC;
            yC += Pix2D.width;
          }
        } else {
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.flatRaster(xC >> 16, xB >> 16, Pix2D.pixels, yC, colour);
                xB += xStepAB;
                xC += xStepAC;
                yC += Pix2D.width;
              }
            }
            this.flatRaster(xC >> 16, xA >> 16, Pix2D.pixels, yC, colour);
            xA += xStepBC;
            xC += xStepAC;
            yC += Pix2D.width;
          }
        }
      }
    }
  }
  static flatRaster(xA, xB, dst, off, colour) {
    if (this.hclip) {
      if (xB > Pix2D.sizeX) {
        xB = Pix2D.sizeX;
      }
      if (xA < 0) {
        xA = 0;
      }
    }
    if (xA >= xB) {
      return;
    }
    off += xA;
    let len = xB - xA >> 2;
    if (this.trans === 0) {
      while (true) {
        len--;
        if (len < 0) {
          len = xB - xA & 3;
          while (true) {
            len--;
            if (len < 0) {
              return;
            }
            dst[off++] = colour;
          }
        }
        dst[off++] = colour;
        dst[off++] = colour;
        dst[off++] = colour;
        dst[off++] = colour;
      }
    } else {
      const alpha = this.trans;
      const invAlpha = 256 - this.trans;
      colour = ((colour & 16711935) * invAlpha >> 8 & 16711935) + ((colour & 65280) * invAlpha >> 8 & 65280);
      while (true) {
        len--;
        if (len < 0) {
          len = xB - xA & 3;
          while (true) {
            len--;
            if (len < 0) {
              return;
            }
            dst[off++] = colour + ((dst[off] & 16711935) * alpha >> 8 & 16711935) + ((dst[off] & 65280) * alpha >> 8 & 65280);
          }
        }
        dst[off++] = colour + ((dst[off] & 16711935) * alpha >> 8 & 16711935) + ((dst[off] & 65280) * alpha >> 8 & 65280);
        dst[off++] = colour + ((dst[off] & 16711935) * alpha >> 8 & 16711935) + ((dst[off] & 65280) * alpha >> 8 & 65280);
        dst[off++] = colour + ((dst[off] & 16711935) * alpha >> 8 & 16711935) + ((dst[off] & 65280) * alpha >> 8 & 65280);
        dst[off++] = colour + ((dst[off] & 16711935) * alpha >> 8 & 16711935) + ((dst[off] & 65280) * alpha >> 8 & 65280);
      }
    }
  }
  static textureTriangle(xA, xB, xC, yA, yB, yC, shadeA, shadeB, shadeC, originX, originY, originZ, txB, txC, tyB, tyC, tzB, tzC, texture) {
    const texels = this.getTexels(texture);
    this.opaque = !this.texTrans[texture];
    const verticalX = originX - txB;
    const verticalY = originY - tyB;
    const verticalZ = originZ - tzB;
    const horizontalX = txC - originX;
    const horizontalY = tyC - originY;
    const horizontalZ = tzC - originZ;
    let u = horizontalX * originY - horizontalY * originX << 14;
    const uStride = horizontalY * originZ - horizontalZ * originY << 8;
    const uStepVertical = horizontalZ * originX - horizontalX * originZ << 5;
    let v = verticalX * originY - verticalY * originX << 14;
    const vStride = verticalY * originZ - verticalZ * originY << 8;
    const vStepVertical = verticalZ * originX - verticalX * originZ << 5;
    let w = verticalY * horizontalX - verticalX * horizontalY << 14;
    const wStride = verticalZ * horizontalY - verticalY * horizontalZ << 8;
    const wStepVertical = verticalX * horizontalZ - verticalZ * horizontalX << 5;
    let xStepAB = 0;
    let shadeStepAB = 0;
    if (yB !== yA) {
      xStepAB = (xB - xA << 16) / (yB - yA) | 0;
      shadeStepAB = (shadeB - shadeA << 16) / (yB - yA) | 0;
    }
    let xStepBC = 0;
    let shadeStepBC = 0;
    if (yC !== yB) {
      xStepBC = (xC - xB << 16) / (yC - yB) | 0;
      shadeStepBC = (shadeC - shadeB << 16) / (yC - yB) | 0;
    }
    let xStepAC = 0;
    let shadeStepAC = 0;
    if (yC !== yA) {
      xStepAC = (xA - xC << 16) / (yA - yC) | 0;
      shadeStepAC = (shadeA - shadeC << 16) / (yA - yC) | 0;
    }
    if (yA <= yB && yA <= yC) {
      if (yA >= Pix2D.clipMaxY) {
        return;
      }
      if (yB > Pix2D.clipMaxY) {
        yB = Pix2D.clipMaxY;
      }
      if (yC > Pix2D.clipMaxY) {
        yC = Pix2D.clipMaxY;
      }
      if (yB < yC) {
        xC = xA <<= 16;
        shadeC = shadeA <<= 16;
        if (yA < 0) {
          xC -= xStepAC * yA;
          xA -= xStepAB * yA;
          shadeC -= shadeStepAC * yA;
          shadeA -= shadeStepAB * yA;
          yA = 0;
        }
        xB <<= 16;
        shadeB <<= 16;
        if (yB < 0) {
          xB -= xStepBC * yB;
          shadeB -= shadeStepBC * yB;
          yB = 0;
        }
        const dy = yA - this.originY;
        u += uStepVertical * dy;
        v += vStepVertical * dy;
        w += wStepVertical * dy;
        u |= 0;
        v |= 0;
        w |= 0;
        if (yA !== yB && xStepAC < xStepAB || yA === yB && xStepAC > xStepBC) {
          yC -= yB;
          yB -= yA;
          yA = this.scanline[yA];
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.textureRaster(xC >> 16, xB >> 16, Pix2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeB >> 8);
                xC += xStepAC;
                xB += xStepBC;
                shadeC += shadeStepAC;
                shadeB += shadeStepBC;
                yA += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xC >> 16, xA >> 16, Pix2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeA >> 8);
            xC += xStepAC;
            xA += xStepAB;
            shadeC += shadeStepAC;
            shadeA += shadeStepAB;
            yA += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        } else {
          yC -= yB;
          yB -= yA;
          yA = this.scanline[yA];
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.textureRaster(xB >> 16, xC >> 16, Pix2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeC >> 8);
                xC += xStepAC;
                xB += xStepBC;
                shadeC += shadeStepAC;
                shadeB += shadeStepBC;
                yA += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xA >> 16, xC >> 16, Pix2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeC >> 8);
            xC += xStepAC;
            xA += xStepAB;
            shadeC += shadeStepAC;
            shadeA += shadeStepAB;
            yA += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        }
      } else {
        xB = xA <<= 16;
        shadeB = shadeA <<= 16;
        if (yA < 0) {
          xB -= xStepAC * yA;
          xA -= xStepAB * yA;
          shadeB -= shadeStepAC * yA;
          shadeA -= shadeStepAB * yA;
          yA = 0;
        }
        xC <<= 16;
        shadeC <<= 16;
        if (yC < 0) {
          xC -= xStepBC * yC;
          shadeC -= shadeStepBC * yC;
          yC = 0;
        }
        const dy = yA - this.originY;
        u += uStepVertical * dy;
        v += vStepVertical * dy;
        w += wStepVertical * dy;
        u |= 0;
        v |= 0;
        w |= 0;
        if ((yA === yC || xStepAC >= xStepAB) && (yA !== yC || xStepBC <= xStepAB)) {
          yB -= yC;
          yC -= yA;
          yA = this.scanline[yA];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.textureRaster(xA >> 16, xC >> 16, Pix2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeC >> 8);
                xC += xStepBC;
                xA += xStepAB;
                shadeC += shadeStepBC;
                shadeA += shadeStepAB;
                yA += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xA >> 16, xB >> 16, Pix2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeB >> 8);
            xB += xStepAC;
            xA += xStepAB;
            shadeB += shadeStepAC;
            shadeA += shadeStepAB;
            yA += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        } else {
          yB -= yC;
          yC -= yA;
          yA = this.scanline[yA];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.textureRaster(xC >> 16, xA >> 16, Pix2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeA >> 8);
                xC += xStepBC;
                xA += xStepAB;
                shadeC += shadeStepBC;
                shadeA += shadeStepAB;
                yA += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xB >> 16, xA >> 16, Pix2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeA >> 8);
            xB += xStepAC;
            xA += xStepAB;
            shadeB += shadeStepAC;
            shadeA += shadeStepAB;
            yA += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        }
      }
    } else if (yB <= yC) {
      if (yB >= Pix2D.clipMaxY) {
        return;
      }
      if (yC > Pix2D.clipMaxY) {
        yC = Pix2D.clipMaxY;
      }
      if (yA > Pix2D.clipMaxY) {
        yA = Pix2D.clipMaxY;
      }
      if (yC < yA) {
        xA = xB <<= 16;
        shadeA = shadeB <<= 16;
        if (yB < 0) {
          xA -= xStepAB * yB;
          xB -= xStepBC * yB;
          shadeA -= shadeStepAB * yB;
          shadeB -= shadeStepBC * yB;
          yB = 0;
        }
        xC <<= 16;
        shadeC <<= 16;
        if (yC < 0) {
          xC -= xStepAC * yC;
          shadeC -= shadeStepAC * yC;
          yC = 0;
        }
        const dy = yB - this.originY;
        u += uStepVertical * dy;
        v += vStepVertical * dy;
        w += wStepVertical * dy;
        u |= 0;
        v |= 0;
        w |= 0;
        if (yB !== yC && xStepAB < xStepBC || yB === yC && xStepAB > xStepAC) {
          yA -= yC;
          yC -= yB;
          yB = this.scanline[yB];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.textureRaster(xA >> 16, xC >> 16, Pix2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeC >> 8);
                xA += xStepAB;
                xC += xStepAC;
                shadeA += shadeStepAB;
                shadeC += shadeStepAC;
                yB += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xA >> 16, xB >> 16, Pix2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeB >> 8);
            xA += xStepAB;
            xB += xStepBC;
            shadeA += shadeStepAB;
            shadeB += shadeStepBC;
            yB += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        } else {
          yA -= yC;
          yC -= yB;
          yB = this.scanline[yB];
          while (true) {
            yC--;
            if (yC < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.textureRaster(xC >> 16, xA >> 16, Pix2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeA >> 8);
                xA += xStepAB;
                xC += xStepAC;
                shadeA += shadeStepAB;
                shadeC += shadeStepAC;
                yB += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xB >> 16, xA >> 16, Pix2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeA >> 8);
            xA += xStepAB;
            xB += xStepBC;
            shadeA += shadeStepAB;
            shadeB += shadeStepBC;
            yB += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        }
      } else {
        xC = xB <<= 16;
        shadeC = shadeB <<= 16;
        if (yB < 0) {
          xC -= xStepAB * yB;
          xB -= xStepBC * yB;
          shadeC -= shadeStepAB * yB;
          shadeB -= shadeStepBC * yB;
          yB = 0;
        }
        xA <<= 16;
        shadeA <<= 16;
        if (yA < 0) {
          xA -= xStepAC * yA;
          shadeA -= shadeStepAC * yA;
          yA = 0;
        }
        const dy = yB - this.originY;
        u += uStepVertical * dy;
        v += vStepVertical * dy;
        w += wStepVertical * dy;
        u |= 0;
        v |= 0;
        w |= 0;
        yC -= yA;
        yA -= yB;
        yB = this.scanline[yB];
        if (xStepAB < xStepBC) {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.textureRaster(xA >> 16, xB >> 16, Pix2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeB >> 8);
                xA += xStepAC;
                xB += xStepBC;
                shadeA += shadeStepAC;
                shadeB += shadeStepBC;
                yB += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xC >> 16, xB >> 16, Pix2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeB >> 8);
            xC += xStepAB;
            xB += xStepBC;
            shadeC += shadeStepAB;
            shadeB += shadeStepBC;
            yB += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        } else {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yC--;
                if (yC < 0) {
                  return;
                }
                this.textureRaster(xB >> 16, xA >> 16, Pix2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeA >> 8);
                xA += xStepAC;
                xB += xStepBC;
                shadeA += shadeStepAC;
                shadeB += shadeStepBC;
                yB += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xB >> 16, xC >> 16, Pix2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeC >> 8);
            xC += xStepAB;
            xB += xStepBC;
            shadeC += shadeStepAB;
            shadeB += shadeStepBC;
            yB += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        }
      }
    } else {
      if (yC >= Pix2D.clipMaxY) {
        return;
      }
      if (yA > Pix2D.clipMaxY) {
        yA = Pix2D.clipMaxY;
      }
      if (yB > Pix2D.clipMaxY) {
        yB = Pix2D.clipMaxY;
      }
      if (yA < yB) {
        xB = xC <<= 16;
        shadeB = shadeC <<= 16;
        if (yC < 0) {
          xB -= xStepBC * yC;
          xC -= xStepAC * yC;
          shadeB -= shadeStepBC * yC;
          shadeC -= shadeStepAC * yC;
          yC = 0;
        }
        xA <<= 16;
        shadeA <<= 16;
        if (yA < 0) {
          xA -= xStepAB * yA;
          shadeA -= shadeStepAB * yA;
          yA = 0;
        }
        const dy = yC - this.originY;
        u += uStepVertical * dy;
        v += vStepVertical * dy;
        w += wStepVertical * dy;
        u |= 0;
        v |= 0;
        w |= 0;
        yB -= yA;
        yA -= yC;
        yC = this.scanline[yC];
        if (xStepBC < xStepAC) {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.textureRaster(xB >> 16, xA >> 16, Pix2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeA >> 8);
                xB += xStepBC;
                xA += xStepAB;
                shadeB += shadeStepBC;
                shadeA += shadeStepAB;
                yC += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xB >> 16, xC >> 16, Pix2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeC >> 8);
            xB += xStepBC;
            xC += xStepAC;
            shadeB += shadeStepBC;
            shadeC += shadeStepAC;
            yC += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        } else {
          while (true) {
            yA--;
            if (yA < 0) {
              while (true) {
                yB--;
                if (yB < 0) {
                  return;
                }
                this.textureRaster(xA >> 16, xB >> 16, Pix2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeB >> 8);
                xB += xStepBC;
                xA += xStepAB;
                shadeB += shadeStepBC;
                shadeA += shadeStepAB;
                yC += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xC >> 16, xB >> 16, Pix2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeB >> 8);
            xB += xStepBC;
            xC += xStepAC;
            shadeB += shadeStepBC;
            shadeC += shadeStepAC;
            yC += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        }
      } else {
        xA = xC <<= 16;
        shadeA = shadeC <<= 16;
        if (yC < 0) {
          xA -= xStepBC * yC;
          xC -= xStepAC * yC;
          shadeA -= shadeStepBC * yC;
          shadeC -= shadeStepAC * yC;
          yC = 0;
        }
        xB <<= 16;
        shadeB <<= 16;
        if (yB < 0) {
          xB -= xStepAB * yB;
          shadeB -= shadeStepAB * yB;
          yB = 0;
        }
        const dy = yC - this.originY;
        u += uStepVertical * dy;
        v += vStepVertical * dy;
        w += wStepVertical * dy;
        u |= 0;
        v |= 0;
        w |= 0;
        yA -= yB;
        yB -= yC;
        yC = this.scanline[yC];
        if (xStepBC < xStepAC) {
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.textureRaster(xB >> 16, xC >> 16, Pix2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeC >> 8);
                xB += xStepAB;
                xC += xStepAC;
                shadeB += shadeStepAB;
                shadeC += shadeStepAC;
                yC += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xA >> 16, xC >> 16, Pix2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeC >> 8);
            xA += xStepBC;
            xC += xStepAC;
            shadeA += shadeStepBC;
            shadeC += shadeStepAC;
            yC += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        } else {
          while (true) {
            yB--;
            if (yB < 0) {
              while (true) {
                yA--;
                if (yA < 0) {
                  return;
                }
                this.textureRaster(xC >> 16, xB >> 16, Pix2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeB >> 8);
                xB += xStepAB;
                xC += xStepAC;
                shadeB += shadeStepAB;
                shadeC += shadeStepAC;
                yC += Pix2D.width;
                u += uStepVertical;
                v += vStepVertical;
                w += wStepVertical;
                u |= 0;
                v |= 0;
                w |= 0;
              }
            }
            this.textureRaster(xC >> 16, xA >> 16, Pix2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeA >> 8);
            xA += xStepBC;
            xC += xStepAC;
            shadeA += shadeStepBC;
            shadeC += shadeStepAC;
            yC += Pix2D.width;
            u += uStepVertical;
            v += vStepVertical;
            w += wStepVertical;
            u |= 0;
            v |= 0;
            w |= 0;
          }
        }
      }
    }
  }
  static textureRaster(xA, xB, dst, off, texels, curU, curV, u, v, w, uStride, vStride, wStride, shadeA, shadeB) {
    if (!texels) {
      return;
    }
    if (xA >= xB) {
      return;
    }
    let shadeStrides;
    let strides;
    if (this.hclip) {
      shadeStrides = (shadeB - shadeA) / (xB - xA) | 0;
      if (xB > Pix2D.sizeX) {
        xB = Pix2D.sizeX;
      }
      if (xA < 0) {
        shadeA -= xA * shadeStrides;
        xA = 0;
      }
      if (xA >= xB) {
        return;
      }
      strides = xB - xA >> 3;
      shadeStrides <<= 12;
    } else {
      if (xB - xA > 7) {
        strides = xB - xA >> 3;
        shadeStrides = (shadeB - shadeA) * this.divTable[strides] >> 6;
      } else {
        strides = 0;
        shadeStrides = 0;
      }
    }
    shadeA <<= 9;
    off += xA;
    let nextU;
    let nextV;
    let curW;
    let dx;
    let stepU;
    let stepV;
    let shadeShift;
    if (this.lowMem) {
      nextU = 0;
      nextV = 0;
      dx = xA - this.originX;
      u = u + (uStride >> 3) * dx;
      v = v + (vStride >> 3) * dx;
      w = w + (wStride >> 3) * dx;
      u |= 0;
      v |= 0;
      w |= 0;
      curW = w >> 12;
      if (curW !== 0) {
        curU = u / curW | 0;
        curV = v / curW | 0;
        if (curU < 0) {
          curU = 0;
        } else if (curU > 4032) {
          curU = 4032;
        }
      }
      u = u + uStride;
      v = v + vStride;
      w = w + wStride;
      u |= 0;
      v |= 0;
      w |= 0;
      curW = w >> 12;
      if (curW !== 0) {
        nextU = u / curW | 0;
        nextV = v / curW | 0;
        if (nextU < 7) {
          nextU = 7;
        } else if (nextU > 4032) {
          nextU = 4032;
        }
      }
      stepU = nextU - curU >> 3;
      stepV = nextV - curV >> 3;
      curU += shadeA >> 3 & 786432;
      shadeShift = shadeA >> 23;
      if (this.opaque) {
        while (strides-- > 0) {
          dst[off++] = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift;
          curU = nextU;
          curV = nextV;
          u += uStride;
          v += vStride;
          w += wStride;
          u |= 0;
          v |= 0;
          w |= 0;
          curW = w >> 12;
          if (curW !== 0) {
            nextU = u / curW | 0;
            nextV = v / curW | 0;
            if (nextU < 7) {
              nextU = 7;
            } else if (nextU > 4032) {
              nextU = 4032;
            }
          }
          stepU = nextU - curU >> 3;
          stepV = nextV - curV >> 3;
          shadeA += shadeStrides;
          curU += shadeA >> 3 & 786432;
          shadeShift = shadeA >> 23;
        }
        strides = xB - xA & 7;
        while (strides-- > 0) {
          dst[off++] = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
        }
      } else {
        while (strides-- > 0) {
          let rgb;
          if ((rgb = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU = nextU;
          curV = nextV;
          u += uStride;
          v += vStride;
          w += wStride;
          u |= 0;
          v |= 0;
          w |= 0;
          curW = w >> 12;
          if (curW !== 0) {
            nextU = u / curW | 0;
            nextV = v / curW | 0;
            if (nextU < 7) {
              nextU = 7;
            } else if (nextU > 4032) {
              nextU = 4032;
            }
          }
          stepU = nextU - curU >> 3;
          stepV = nextV - curV >> 3;
          shadeA += shadeStrides;
          curU += shadeA >> 3 & 786432;
          shadeShift = shadeA >> 23;
        }
        strides = xB - xA & 7;
        while (strides-- > 0) {
          let rgb;
          if ((rgb = texels[(curV & 4032) + (curU >> 6)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
        }
      }
    } else {
      nextU = 0;
      nextV = 0;
      dx = xA - this.originX;
      u = u + (uStride >> 3) * dx;
      v = v + (vStride >> 3) * dx;
      w = w + (wStride >> 3) * dx;
      u |= 0;
      v |= 0;
      w |= 0;
      curW = w >> 14;
      if (curW !== 0) {
        curU = u / curW | 0;
        curV = v / curW | 0;
        if (curU < 0) {
          curU = 0;
        } else if (curU > 16256) {
          curU = 16256;
        }
      }
      u = u + uStride;
      v = v + vStride;
      w = w + wStride;
      u |= 0;
      v |= 0;
      w |= 0;
      curW = w >> 14;
      if (curW !== 0) {
        nextU = u / curW | 0;
        nextV = v / curW | 0;
        if (nextU < 7) {
          nextU = 7;
        } else if (nextU > 16256) {
          nextU = 16256;
        }
      }
      stepU = nextU - curU >> 3;
      stepV = nextV - curV >> 3;
      curU += shadeA & 6291456;
      shadeShift = shadeA >> 23;
      if (this.opaque) {
        while (strides-- > 0) {
          dst[off++] = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
          dst[off++] = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift;
          curU = nextU;
          curV = nextV;
          u += uStride;
          v += vStride;
          w += wStride;
          u |= 0;
          v |= 0;
          w |= 0;
          curW = w >> 14;
          if (curW !== 0) {
            nextU = u / curW | 0;
            nextV = v / curW | 0;
            if (nextU < 7) {
              nextU = 7;
            } else if (nextU > 16256) {
              nextU = 16256;
            }
          }
          stepU = nextU - curU >> 3;
          stepV = nextV - curV >> 3;
          shadeA += shadeStrides;
          curU += shadeA & 6291456;
          shadeShift = shadeA >> 23;
        }
        strides = xB - xA & 7;
        while (strides-- > 0) {
          dst[off++] = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift;
          curU += stepU;
          curV += stepV;
        }
      } else {
        while (strides-- > 0 && texels) {
          let rgb;
          if ((rgb = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
          if ((rgb = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU = nextU;
          curV = nextV;
          u += uStride;
          v += vStride;
          w += wStride;
          u |= 0;
          v |= 0;
          w |= 0;
          curW = w >> 14;
          if (curW !== 0) {
            nextU = u / curW | 0;
            nextV = v / curW | 0;
            if (nextU < 7) {
              nextU = 7;
            } else if (nextU > 16256) {
              nextU = 16256;
            }
          }
          stepU = nextU - curU >> 3;
          stepV = nextV - curV >> 3;
          shadeA += shadeStrides;
          curU += shadeA & 6291456;
          shadeShift = shadeA >> 23;
        }
        strides = xB - xA & 7;
        while (strides-- > 0 && texels) {
          let rgb;
          if ((rgb = texels[(curV & 16256) + (curU >> 7)] >>> shadeShift) !== 0) {
            dst[off] = rgb;
          }
          off++;
          curU += stepU;
          curV += stepV;
        }
      }
    }
  }
}

// src/graphics/PixMap.ts
class PixMap {
  data;
  width;
  height;
  img;
  ctx;
  paint;
  constructor(width, height, ctx = canvas2d) {
    this.width = width;
    this.height = height;
    this.data = new Int32Array(width * height);
    this.ctx = ctx;
    this.img = this.ctx.createImageData(width, height);
    this.paint = new Uint32Array(this.img.data.buffer);
    this.setPixels();
  }
  setPixels() {
    Pix2D.setPixels(this.data, this.width, this.height);
  }
  draw(x, y) {
    this.prepareCanvas();
    this.ctx.putImageData(this.img, x, y);
  }
  prepareCanvas() {
    const data = this.data;
    const paint = this.paint;
    const len = data.length;
    let i = 0;
    const unroll = len - len % 4;
    for (;i < unroll; i += 4) {
      const p0 = data[i];
      const p1 = data[i + 1];
      const p2 = data[i + 2];
      const p3 = data[i + 3];
      paint[i] = (p0 & 16711680) >> 16 | p0 & 65280 | (p0 & 255) << 16 | 4278190080;
      paint[i + 1] = (p1 & 16711680) >> 16 | p1 & 65280 | (p1 & 255) << 16 | 4278190080;
      paint[i + 2] = (p2 & 16711680) >> 16 | p2 & 65280 | (p2 & 255) << 16 | 4278190080;
      paint[i + 3] = (p3 & 16711680) >> 16 | p3 & 65280 | (p3 & 255) << 16 | 4278190080;
    }
    for (;i < len; i++) {
      const pixel = data[i];
      paint[i] = (pixel & 16711680) >> 16 | pixel & 65280 | (pixel & 255) << 16 | 4278190080;
    }
  }
}

// src/client/GameShell.ts
class GameShell {
  state = 0;
  deltime = 20;
  mindel = 1;
  otim = new Array(10);
  fps = 0;
  drawArea = null;
  fullredraw = true;
  focus = true;
  idleTimer = performance.now();
  mouseButton = 0;
  mouseX = -1;
  mouseY = -1;
  mouseClickButton = 0;
  mouseClickX = -1;
  mouseClickY = -1;
  keyHeld = [];
  keyQueue = [];
  keyQueueReadPos = 0;
  keyQueueWritePos = 0;
  resizeToFit = false;
  tfps = 50;
  async maininit() {}
  async mainloop() {}
  async maindraw() {}
  refresh() {}
  stealF12() {
    return false;
  }
  stealF10() {
    return false;
  }
  stealF9() {
    return false;
  }
  stealF7() {
    return false;
  }
  stealShiftS() {
    return false;
  }
  constructor(resizetoFit = false) {
    canvas.tabIndex = -1;
    canvas2d.fillStyle = "black";
    canvas2d.fillRect(0, 0, canvas.width, canvas.height);
    this.resizeToFit = resizetoFit;
    if (this.resizeToFit) {
      this.resize(window.innerWidth, window.innerHeight);
    } else {
      this.resize(canvas.width, canvas.height);
    }
  }
  get sWid() {
    return canvas.width;
  }
  get sHei() {
    return canvas.height;
  }
  resize(width, height) {
    canvas.width = width;
    canvas.height = height;
    this.drawArea = new PixMap(width, height);
    Pix3D.setRenderClipping();
  }
  async run() {
    canvas.addEventListener("resize", () => {
      if (this.resizeToFit) {
        this.resize(window.innerWidth, window.innerHeight);
      }
    }, false);
    canvas.onfocus = this.onfocus.bind(this);
    canvas.onblur = this.onblur.bind(this);
    canvas.onkeydown = this.onkeydown.bind(this);
    canvas.onkeyup = this.onkeyup.bind(this);
    window.addEventListener("keydown", (e) => {
      if (e.key === "F12" && this.stealF12()) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "F10" && this.stealF10()) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "F9" && this.stealF9()) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "F7" && this.stealF7()) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && e.code === "KeyS" && this.stealShiftS()) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    canvas.onmousedown = this.onmousedown.bind(this);
    canvas.onpointerdown = this.onpointerdown.bind(this);
    canvas.onmouseup = this.onmouseup.bind(this);
    canvas.onpointerup = this.onpointerup.bind(this);
    canvas.onpointerenter = this.onpointerenter.bind(this);
    canvas.onpointerleave = this.onpointerleave.bind(this);
    canvas.onpointermove = this.onpointermove.bind(this);
    window.onmouseup = this.windowMouseUp.bind(this);
    window.onmousemove = this.windowMouseMove.bind(this);
    if (this.isTouchDevice) {
      if (this.hasTouchEvents) {
        canvas.ontouchstart = this.ontouchstart.bind(this);
      } else {
        canvas.style.touchAction = "none";
      }
    }
    canvas.oncontextmenu = (e) => {
      e.preventDefault();
    };
    window.oncontextmenu = (e) => {
      e.preventDefault();
    };
    await this.messageBox(0, "Loading...");
    await this.maininit();
    let ntime = 0;
    let opos = 0;
    let ratio = 256;
    let delta = 1;
    let count = 0;
    for (let i = 0;i < 10; i++) {
      this.otim[i] = performance.now();
    }
    while (this.state >= 0) {
      if (this.state > 0) {
        this.state--;
        if (this.state === 0) {
          this.shutdown();
          return;
        }
      }
      const lastRatio = ratio;
      const lastDelta = delta;
      ratio = 300;
      delta = 1;
      ntime = performance.now();
      const otim = this.otim[opos];
      if (otim === 0) {
        ratio = lastRatio;
        delta = lastDelta;
      } else if (ntime > otim) {
        ratio = this.deltime * 2560 / (ntime - otim) | 0;
      }
      if (ratio < 25) {
        ratio = 25;
      } else if (ratio > 256) {
        ratio = 256;
        delta = this.deltime - (ntime - otim) / 10 | 0;
      }
      this.otim[opos] = ntime;
      opos = (opos + 1) % 10;
      if (delta > 1) {
        for (let i = 0;i < 10; i++) {
          if (this.otim[i] !== 0) {
            this.otim[i] += delta;
          }
        }
      }
      if (delta < this.mindel) {
        delta = this.mindel;
      }
      await sleep(delta);
      while (count < 256) {
        await this.mainloop();
        this.mouseClickButton = 0;
        this.keyQueueReadPos = this.keyQueueWritePos;
        count += ratio;
      }
      count &= 255;
      if (this.deltime > 0) {
        this.fps = ratio * 1000 / (this.deltime * 256) | 0;
      }
      await this.maindraw();
      if (this.tfps < 50) {
        const tfps = 1000 / this.tfps - (performance.now() - ntime);
        if (tfps > 0) {
          await sleep(tfps);
        }
      }
    }
    if (this.state === -1) {
      this.shutdown();
    }
  }
  shutdown() {
    this.state = -2;
  }
  setFramerate(rate) {
    this.deltime = 1000 / rate | 0;
  }
  setTargetedFramerate(rate) {
    this.tfps = Math.max(Math.min(50, rate | 0), 0);
  }
  start() {
    if (this.state >= 0) {
      this.state = 0;
    }
  }
  stop() {
    if (this.state >= 0) {
      this.state = 4000 / this.deltime | 0;
    }
  }
  async messageBox(progress, message) {
    const width = this.sWid;
    const height = this.sHei;
    if (this.fullredraw) {
      canvas2d.fillStyle = "black";
      canvas2d.fillRect(0, 0, width, height);
      this.fullredraw = false;
    }
    const y = height / 2 - 18;
    canvas2d.strokeStyle = "rgb(140, 17, 17)";
    canvas2d.strokeRect((width / 2 | 0) - 152, y, 304, 34);
    canvas2d.fillStyle = "rgb(140, 17, 17)";
    canvas2d.fillRect((width / 2 | 0) - 150, y + 2, progress * 3, 30);
    canvas2d.fillStyle = "black";
    canvas2d.fillRect((width / 2 | 0) - 150 + progress * 3, y + 2, 300 - progress * 3, 30);
    canvas2d.font = "bold 13px helvetica, sans-serif";
    canvas2d.textAlign = "center";
    canvas2d.fillStyle = "white";
    canvas2d.fillText(message, width / 2 | 0, y + 22);
    await sleep(5);
  }
  onmousedown(e) {
    if (e.clientX < 0 || e.clientY < 0) {
      return;
    }
    const { x, y } = this.getMousePos(e);
    this.mouseDown(x, y, e);
  }
  mouseDown(x, y, e) {
    this.idleTimer = performance.now();
    this.mouseClickX = x;
    this.mouseClickY = y;
    this.mouseX = x;
    this.mouseY = y;
    if (e.button === 2) {
      this.mouseClickButton = 2;
      this.mouseButton = 2;
    } else {
      this.mouseClickButton = 1;
      this.mouseButton = 1;
    }
    if (InputTracking.active) {
      InputTracking.mousePressed(x, y, e.button, "mouse");
    }
  }
  onpointerdown(e) {
    if (e.clientX < 0 || e.clientY < 0) {
      return;
    }
    const { x, y } = this.getMousePos(e);
    this.pointerDown(x, y, e);
  }
  pointerDown(_x, _y, _e) {}
  onmouseup(e) {
    const { x, y } = this.getMousePos(e);
    this.mouseUp(x, y, e);
  }
  mouseUp(x, y, e) {
    this.idleTimer = performance.now();
    this.mouseButton = 0;
    if (InputTracking.active) {
      InputTracking.mouseReleased(e.button, "mouse");
    }
    this.mouseX = x;
    this.mouseY = y;
  }
  onpointerup(e) {
    const { x, y } = this.getMousePos(e);
    this.pointerUp(x, y, e);
  }
  pointerUp(_x, _y, _e) {}
  onpointerenter(e) {
    if (e.clientX < 0 || e.clientY < 0) {
      return;
    }
    const { x, y } = this.getMousePos(e);
    this.pointerEnter(x, y, e);
  }
  pointerEnter(x, y, _e) {
    this.mouseX = x;
    this.mouseY = y;
    if (InputTracking.active) {
      InputTracking.mouseEntered();
    }
  }
  onpointerleave(e) {
    this.pointerLeave(e);
  }
  pointerLeave(_e) {
    this.idleTimer = performance.now();
    this.mouseX = -1;
    this.mouseY = -1;
    if (InputTracking.active) {
      InputTracking.mouseExited();
    }
    this.mouseClickX = -1;
    this.mouseClickY = -1;
    this.mouseClickButton = 0;
    this.mouseButton = 0;
  }
  onpointermove(e) {
    if (e.clientX < 0 || e.clientY < 0) {
      return;
    }
    const { x, y } = this.getMousePos(e);
    this.pointerMove(x, y, e);
  }
  pointerMove(x, y, e) {
    this.idleTimer = performance.now();
    this.mouseX = x;
    this.mouseY = y;
    if (InputTracking.active) {
      InputTracking.mouseMoved(x, y, e.pointerType);
    }
  }
  windowMouseUp(e) {}
  windowMouseMove(e) {}
  ontouchstart(e) {
    this.touchStart(e);
  }
  touchStart(e) {
    if (e.touches.length < 2) {
      e.preventDefault();
    }
  }
  onkeydown(e) {
    this.idleTimer = performance.now();
    const keyCode = KeyCodes.get(e.key);
    if (!keyCode || e.code.length === 0 && !e.isTrusted) {
      return;
    }
    let ch = keyCode.ch;
    if (e.ctrlKey) {
      if (ch >= 65 && ch <= 93 || ch == 95) {
        ch -= 65 - 1;
      } else if (ch >= 97 && ch <= 122) {
        ch -= 97 - 1;
      }
    }
    if (ch > 0 && ch < 128) {
      this.keyHeld[ch] = 1;
    }
    if (ch > 4) {
      this.keyQueue[this.keyQueueWritePos] = ch;
      this.keyQueueWritePos = this.keyQueueWritePos + 1 & 127;
    }
    if (InputTracking.active) {
      InputTracking.keyPressed(ch);
    }
    if (!CanvasEnabledKeys.includes(e.key)) {
      e.preventDefault();
    }
  }
  onkeyup(e) {
    this.idleTimer = performance.now();
    const keyCode = KeyCodes.get(e.key);
    if (!keyCode || e.code.length === 0 && !e.isTrusted) {
      return;
    }
    let ch = keyCode.ch;
    if (e.ctrlKey) {
      if (ch >= 65 && ch <= 93 || ch == 95) {
        ch -= 65 - 1;
      } else if (ch >= 97 && ch <= 122) {
        ch -= 97 - 1;
      }
    }
    if (ch > 0 && ch < 128) {
      this.keyHeld[ch] = 0;
    }
    if (InputTracking.active) {
      InputTracking.keyReleased(ch);
    }
    if (!CanvasEnabledKeys.includes(e.key)) {
      e.preventDefault();
    }
  }
  pollKey() {
    let key = -1;
    if (this.keyQueueWritePos !== this.keyQueueReadPos) {
      key = this.keyQueue[this.keyQueueReadPos];
      this.keyQueueReadPos = this.keyQueueReadPos + 1 & 127;
    }
    return key;
  }
  onfocus(_e) {
    this.focus = true;
    this.fullredraw = true;
    this.refresh();
    if (InputTracking.active) {
      InputTracking.focusGained();
    }
  }
  onblur(_e) {
    this.focus = false;
    for (let i = 0;i < 128; i++) {
      this.keyHeld[i] = 0;
    }
    if (InputTracking.active) {
      InputTracking.focusLost();
    }
  }
  get hasTouchEvents() {
    return "ontouchstart" in window;
  }
  get isTouchDevice() {
    return this.hasTouchEvents || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }
  get isMobile() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone|Mobile/i.test(navigator.userAgent)) {
      return true;
    }
    return this.isTouchDevice;
  }
  isFullScreen() {
    return document.fullscreenElement !== null;
  }
  getMousePos(e) {
    const fixedWidth = this.sWid;
    const fixedHeight = this.sHei;
    const canvasBounds = canvas.getBoundingClientRect();
    const clickLocWithinCanvas = {
      x: e.clientX - canvasBounds.left,
      y: e.clientY - canvasBounds.top
    };
    let x = 0;
    let y = 0;
    if (this.isFullScreen()) {
      const gameAspectRatio = fixedWidth / fixedHeight;
      const ourAspectRatio = window.innerWidth / window.innerHeight;
      const wider = ourAspectRatio >= gameAspectRatio;
      let trueCanvasWidth = 0;
      let trueCanvasHeight = 0;
      let offsetX = 0;
      let offsetY = 0;
      if (wider) {
        trueCanvasWidth = window.innerHeight * gameAspectRatio;
        trueCanvasHeight = window.innerHeight;
        offsetX = (window.innerWidth - trueCanvasWidth) / 2;
      } else {
        trueCanvasWidth = window.innerWidth;
        trueCanvasHeight = window.innerWidth / gameAspectRatio;
        offsetY = (window.innerHeight - trueCanvasHeight) / 2;
      }
      const scaleX = fixedWidth / trueCanvasWidth;
      const scaleY = fixedHeight / trueCanvasHeight;
      x = (clickLocWithinCanvas.x - offsetX) * scaleX | 0;
      y = (clickLocWithinCanvas.y - offsetY) * scaleY | 0;
    } else {
      const scaleX = canvas.width / canvasBounds.width;
      const scaleY = canvas.height / canvasBounds.height;
      x = clickLocWithinCanvas.x * scaleX | 0;
      y = clickLocWithinCanvas.y * scaleY | 0;
    }
    if (x < 0) {
      x = 0;
    }
    if (x > fixedWidth) {
      x = fixedWidth;
    }
    if (y < 0) {
      y = 0;
    }
    if (y > fixedHeight) {
      y = fixedHeight;
    }
    return { x, y };
  }
}

// src/config/FloType.ts
class FloType {
  static numDefinitions = 0;
  static list = [];
  colour = 0;
  texture = -1;
  overlay = false;
  occlude = true;
  debugname = "";
  hue = 0;
  saturation = 0;
  lightness = 0;
  chroma = 0;
  underlayHue = 0;
  overlayHsl = 0;
  static init(config) {
    const dat = new Packet(config.read("flo.dat"));
    this.numDefinitions = dat.g2();
    this.list = new Array(this.numDefinitions);
    for (let id = 0;id < this.numDefinitions; id++) {
      if (!this.list[id]) {
        this.list[id] = new FloType;
      }
      this.list[id].decode(dat);
    }
  }
  decode(dat) {
    while (true) {
      const code = dat.g1();
      if (code === 0) {
        break;
      }
      if (code === 1) {
        this.colour = dat.g3();
        this.getHsl(this.colour);
      } else if (code === 2) {
        this.texture = dat.g1();
      } else if (code === 3) {
        this.overlay = true;
      } else if (code === 5) {
        this.occlude = false;
      } else if (code === 6) {
        this.debugname = dat.gjstr();
      } else {
        console.log("Error unrecognised config code: ", code);
      }
    }
  }
  getHsl(rgb) {
    const red = (rgb >> 16 & 255) / 256;
    const green = (rgb >> 8 & 255) / 256;
    const blue = (rgb & 255) / 256;
    let min = red;
    if (green < red) {
      min = green;
    }
    if (blue < min) {
      min = blue;
    }
    let max = red;
    if (green > red) {
      max = green;
    }
    if (blue > max) {
      max = blue;
    }
    let h = 0;
    let s = 0;
    const l = (min + max) / 2;
    if (min !== max) {
      if (l < 0.5) {
        s = (max - min) / (max + min);
      }
      if (l >= 0.5) {
        s = (max - min) / (2 - max - min);
      }
      if (red === max) {
        h = (green - blue) / (max - min);
      } else if (green === max) {
        h = (blue - red) / (max - min) + 2;
      } else if (blue === max) {
        h = (red - green) / (max - min) + 4;
      }
    }
    h /= 6;
    this.hue = h * 256 | 0;
    this.saturation = s * 256 | 0;
    this.lightness = l * 256 | 0;
    if (this.saturation < 0) {
      this.saturation = 0;
    } else if (this.saturation > 255) {
      this.saturation = 255;
    }
    if (this.lightness < 0) {
      this.lightness = 0;
    } else if (this.lightness > 255) {
      this.lightness = 255;
    }
    if (l > 0.5) {
      this.chroma = (1 - l) * s * 512 | 0;
    } else {
      this.chroma = l * s * 512 | 0;
    }
    if (this.chroma < 1) {
      this.chroma = 1;
    }
    this.underlayHue = h * this.chroma | 0;
    let hue = this.hue + (Math.random() * 16 | 0) - 8;
    if (hue < 0) {
      hue = 0;
    } else if (hue > 255) {
      hue = 255;
    }
    let saturation = this.saturation + (Math.random() * 48 | 0) - 24;
    if (saturation < 0) {
      saturation = 0;
    } else if (saturation > 255) {
      saturation = 255;
    }
    let lightness = this.lightness + (Math.random() * 48 | 0) - 24;
    if (lightness < 0) {
      lightness = 0;
    } else if (lightness > 255) {
      lightness = 255;
    }
    this.overlayHsl = FloType.getTable(hue, saturation, lightness);
  }
  static getTable(hue, saturation, lightness) {
    if (lightness > 179) {
      saturation = saturation / 2 | 0;
    }
    if (lightness > 192) {
      saturation = saturation / 2 | 0;
    }
    if (lightness > 217) {
      saturation = saturation / 2 | 0;
    }
    if (lightness > 243) {
      saturation = saturation / 2 | 0;
    }
    return ((hue / 4 | 0) << 10) + ((saturation / 32 | 0) << 7) + (lightness / 2 | 0);
  }
}

// src/dash3d/AnimBase.ts
class AnimBase {
  static list = [];
  size = 0;
  type = null;
  labels = null;
  static init(models) {
    const head = new Packet(models.read("base_head.dat"));
    const type = new Packet(models.read("base_type.dat"));
    const label = new Packet(models.read("base_label.dat"));
    const total = head.g2();
    head.pos += 2;
    for (let i = 0;i < total; i++) {
      const id = head.g2();
      const length = head.g1();
      const transformTypes = new Uint8Array(length);
      const groupLabels = new TypedArray1d(length, null);
      for (let j = 0;j < length; j++) {
        transformTypes[j] = type.g1();
        const groupCount = label.g1();
        const labels = new Uint8Array(groupCount);
        for (let k = 0;k < groupCount; k++) {
          labels[k] = label.g1();
        }
        groupLabels[j] = labels;
      }
      this.list[id] = new AnimBase;
      this.list[id].size = length;
      this.list[id].type = transformTypes;
      this.list[id].labels = groupLabels;
    }
  }
}

// src/dash3d/AnimFrame.ts
class AnimFrame {
  static list = [];
  delay = 0;
  base = null;
  size = 0;
  ti = null;
  tx = null;
  ty = null;
  tz = null;
  static init(models) {
    const head = new Packet(models.read("frame_head.dat"));
    const tran1 = new Packet(models.read("frame_tran1.dat"));
    const tran2 = new Packet(models.read("frame_tran2.dat"));
    const del = new Packet(models.read("frame_del.dat"));
    const total = head.g2();
    head.pos += 2;
    const tempTi = new Int32Array(500);
    const tempTx = new Int32Array(500);
    const tempTy = new Int32Array(500);
    const tempTz = new Int32Array(500);
    for (let i = 0;i < total; i++) {
      const id = head.g2();
      const frame = this.list[id] = new AnimFrame;
      frame.delay = del.g1();
      const baseId = head.g2();
      const base = AnimBase.list[baseId];
      frame.base = base;
      const groupCount = head.g1();
      let lastGroup = -1;
      let current = 0;
      for (let j = 0;j < groupCount; j++) {
        if (!base.type) {
          throw new Error;
        }
        const flags = tran1.g1();
        if (flags > 0) {
          if (base.type[j] !== 0) {
            for (let group = j - 1;group > lastGroup; group--) {
              if (base.type[group] === 0) {
                tempTi[current] = group;
                tempTx[current] = 0;
                tempTy[current] = 0;
                tempTz[current] = 0;
                current++;
                break;
              }
            }
          }
          tempTi[current] = j;
          let defaultValue = 0;
          if (base.type[tempTi[current]] === 3 /* SCALE */) {
            defaultValue = 128;
          }
          if ((flags & 1) === 0) {
            tempTx[current] = defaultValue;
          } else {
            tempTx[current] = tran2.gsmarts();
          }
          if ((flags & 2) === 0) {
            tempTy[current] = defaultValue;
          } else {
            tempTy[current] = tran2.gsmarts();
          }
          if ((flags & 4) === 0) {
            tempTz[current] = defaultValue;
          } else {
            tempTz[current] = tran2.gsmarts();
          }
          lastGroup = j;
          current++;
        }
      }
      frame.size = current;
      frame.ti = new Int32Array(current);
      frame.tx = new Int32Array(current);
      frame.ty = new Int32Array(current);
      frame.tz = new Int32Array(current);
      for (let j = 0;j < current; j++) {
        frame.ti[j] = tempTi[j];
        frame.tx[j] = tempTx[j];
        frame.ty[j] = tempTy[j];
        frame.tz[j] = tempTz[j];
      }
    }
  }
}

// src/config/SeqType.ts
class SeqType {
  static numDefinitions = 0;
  static list = [];
  numFrames = 0;
  frames = null;
  iframes = null;
  delay = null;
  loops = -1;
  walkmerge = null;
  reachforward = false;
  priority = 5;
  replaceheldleft = -1;
  replaceheldright = -1;
  maxloops = 99;
  duration = 0;
  static init(config) {
    const dat = new Packet(config.read("seq.dat"));
    this.numDefinitions = dat.g2();
    this.list = new Array(this.numDefinitions);
    for (let id = 0;id < this.numDefinitions; id++) {
      if (!this.list[id]) {
        this.list[id] = new SeqType;
      }
      this.list[id].decode(dat);
    }
  }
  decode(dat) {
    while (true) {
      const code = dat.g1();
      if (code === 0) {
        break;
      }
      if (code === 1) {
        this.numFrames = dat.g1();
        this.frames = new Int16Array(this.numFrames);
        this.iframes = new Int16Array(this.numFrames);
        this.delay = new Int16Array(this.numFrames);
        for (let i = 0;i < this.numFrames; i++) {
          this.frames[i] = dat.g2();
          this.iframes[i] = dat.g2();
          if (this.iframes[i] === 65535) {
            this.iframes[i] = -1;
          }
          this.delay[i] = dat.g2();
          if (this.delay[i] === 0) {
            this.delay[i] = AnimFrame.list[this.frames[i]].delay;
          }
          if (this.delay[i] === 0) {
            this.delay[i] = 1;
          }
          this.duration += this.delay[i];
        }
      } else if (code === 2) {
        this.loops = dat.g2();
      } else if (code === 3) {
        const count = dat.g1();
        this.walkmerge = new Int32Array(count + 1);
        for (let i = 0;i < count; i++) {
          this.walkmerge[i] = dat.g1();
        }
        this.walkmerge[count] = 9999999;
      } else if (code === 4) {
        this.reachforward = true;
      } else if (code === 5) {
        this.priority = dat.g1();
      } else if (code === 6) {
        this.replaceheldleft = dat.g2();
      } else if (code === 7) {
        this.replaceheldright = dat.g2();
      } else if (code === 8) {
        this.maxloops = dat.g1();
      } else {
        console.log("Error unrecognised seq config code: ", code);
      }
    }
    if (this.numFrames === 0) {
      this.numFrames = 1;
      this.frames = new Int16Array(1);
      this.frames[0] = -1;
      this.iframes = new Int16Array(1);
      this.iframes[0] = -1;
      this.delay = new Int16Array(1);
      this.delay[0] = -1;
    }
  }
}

// src/datastruct/HashTable.ts
class HashTable {
  bucketCount;
  buckets;
  constructor(size) {
    this.buckets = new Array(size);
    this.bucketCount = size;
    for (let i = 0;i < size; i++) {
      const sentinel = this.buckets[i] = new Linkable;
      sentinel.next = sentinel;
      sentinel.prev = sentinel;
    }
  }
  find(key) {
    const start = this.buckets[Number(key & BigInt(this.bucketCount - 1))];
    for (let node = start.next;node !== start; node = node?.next ?? null) {
      if (node && node.key === key) {
        return node;
      }
    }
    return null;
  }
  put(key, node) {
    if (node.prev) {
      node.unlink();
    }
    const sentinel = this.buckets[Number(key & BigInt(this.bucketCount - 1))];
    node.prev = sentinel.prev;
    node.next = sentinel;
    if (node.prev) {
      node.prev.next = node;
    }
    node.next.prev = node;
    node.key = key;
  }
}

// src/datastruct/LinkList2.ts
class LinkList2 {
  sentinel = new Linkable2;
  cursor = null;
  constructor() {
    this.sentinel.next2 = this.sentinel;
    this.sentinel.prev2 = this.sentinel;
  }
  push(node) {
    if (node.prev2) {
      node.unlink2();
    }
    node.prev2 = this.sentinel.prev2;
    node.next2 = this.sentinel;
    if (node.prev2) {
      node.prev2.next2 = node;
    }
    node.next2.prev2 = node;
  }
  popFront() {
    const node = this.sentinel.next2;
    if (node === this.sentinel) {
      return null;
    } else {
      node?.unlink2();
      return node;
    }
  }
  head() {
    const node = this.sentinel.next2;
    if (node === this.sentinel) {
      this.cursor = null;
      return null;
    }
    this.cursor = node?.next2 ?? null;
    return node;
  }
  next() {
    const node = this.cursor;
    if (node === this.sentinel) {
      this.cursor = null;
      return null;
    }
    this.cursor = node?.next2 ?? null;
    return node;
  }
  size() {
    let count = 0;
    for (let node = this.sentinel.next2;node !== this.sentinel && node; node = node.next2) {
      count++;
    }
    return count;
  }
}

// src/datastruct/LruCache.ts
class LruCache {
  capacity;
  table = new HashTable(1024);
  history = new LinkList2;
  available;
  constructor(size) {
    this.capacity = size;
    this.available = size;
  }
  find(key) {
    const node = this.table.find(key);
    if (node) {
      this.history.push(node);
    }
    return node;
  }
  put(key, node) {
    if (this.available === 0) {
      const first = this.history.popFront();
      first?.unlink();
      first?.unlink2();
    } else {
      this.available--;
    }
    this.table.put(key, node);
    this.history.push(node);
  }
  clear() {
    while (true) {
      const node = this.history.popFront();
      if (!node) {
        this.available = this.capacity;
        return;
      }
      node.unlink();
      node.unlink2();
    }
  }
}

// src/dash3d/LocShape.ts
var LOC_SHAPE_TO_LAYER = [
  0 /* WALL */,
  0 /* WALL */,
  0 /* WALL */,
  0 /* WALL */,
  1 /* WALL_DECOR */,
  1 /* WALL_DECOR */,
  1 /* WALL_DECOR */,
  1 /* WALL_DECOR */,
  1 /* WALL_DECOR */,
  2 /* GROUND */,
  2 /* GROUND */,
  2 /* GROUND */,
  2 /* GROUND */,
  2 /* GROUND */,
  2 /* GROUND */,
  2 /* GROUND */,
  2 /* GROUND */,
  2 /* GROUND */,
  2 /* GROUND */,
  2 /* GROUND */,
  2 /* GROUND */,
  2 /* GROUND */,
  3 /* GROUND_DECOR */
];

// src/dash3d/PointNormal.ts
class PointNormal {
  x = 0;
  y = 0;
  z = 0;
  w = 0;
}

// src/dash3d/Model.ts
class Metadata {
  src = null;
  numPoints = 0;
  numFaces = 0;
  numT = 0;
  vertexOrderOffset = -1;
  vertexXOffset = -1;
  vertexYOffset = -1;
  vertexZOffset = -1;
  vertexLabelOffset = -1;
  faceIndexOffset = -1;
  faceIndexOrderOffset = -1;
  faceColourOffset = -1;
  faceRenderTypeOffset = -1;
  facePriorityOffset = 0;
  faceAlphaOffset = -1;
  faceLabelOffset = -1;
  faceTextureAxisOffset = -1;
}

class Model extends Linkable2 {
  static head = null;
  static face1 = null;
  static face2 = null;
  static face3 = null;
  static face4 = null;
  static face5 = null;
  static point1 = null;
  static point2 = null;
  static point3 = null;
  static point4 = null;
  static point5 = null;
  static vertex1 = null;
  static vertex2 = null;
  static axis = null;
  static meta = [];
  numPoints = 0;
  pointX = new Int32Array;
  pointY = new Int32Array;
  pointZ = new Int32Array;
  numFaces = 0;
  faceVertexA = new Int32Array;
  faceVertexB = new Int32Array;
  faceVertexC = new Int32Array;
  faceRenderType = null;
  facePriority = null;
  faceAlpha = null;
  faceColour = null;
  priority = 0;
  numT = 0;
  faceTextureP = null;
  faceTextureM = null;
  faceTextureN = null;
  vertexLabel = null;
  faceLabel = null;
  labelVertices = null;
  labelFaces = null;
  pointNormal = null;
  sharedPointNormal = null;
  minY = 0;
  maxY = 0;
  minX = 0;
  maxX = 0;
  minZ = 0;
  maxZ = 0;
  objRaise = 0;
  faceColourA = null;
  faceColourB = null;
  faceColourC = null;
  useAABBMouseCheck = false;
  radius = 0;
  maxDepth = 0;
  minDepth = 0;
  static faceClippedX = new TypedArray1d(4096, false);
  static faceNearClipped = new TypedArray1d(4096, false);
  static vertexScreenX = new Int32Array(4096);
  static vertexScreenY = new Int32Array(4096);
  static vertexScreenZ = new Int32Array(4096);
  static vertexViewSpaceX = new Int32Array(4096);
  static vertexViewSpaceY = new Int32Array(4096);
  static vertexViewSpaceZ = new Int32Array(4096);
  static tmpDepthFaceCount = new Int32Array(1500);
  static tmpDepthFaces = new Int32Array2d(1500, 512);
  static tmpPriorityFaceCount = new Int32Array(12);
  static tmpPriorityFaces = new Int32Array2d(12, 2000);
  static tmpPriority10FaceDepth = new Int32Array(2000);
  static tmpPriority11FaceDepth = new Int32Array(2000);
  static tmpPriorityDepthSum = new Int32Array(12);
  static clippedX = new Int32Array(10);
  static clippedY = new Int32Array(10);
  static clippedColour = new Int32Array(10);
  static oX = 0;
  static oY = 0;
  static oZ = 0;
  static mouseCheck = false;
  static mouseX = 0;
  static mouseY = 0;
  static pickedCount = 0;
  static pickedEntityTypecode = new Int32Array(1000);
  static init(models) {
    try {
      Model.head = new Packet(models.read("ob_head.dat"));
      Model.face1 = new Packet(models.read("ob_face1.dat"));
      Model.face2 = new Packet(models.read("ob_face2.dat"));
      Model.face3 = new Packet(models.read("ob_face3.dat"));
      Model.face4 = new Packet(models.read("ob_face4.dat"));
      Model.face5 = new Packet(models.read("ob_face5.dat"));
      Model.point1 = new Packet(models.read("ob_point1.dat"));
      Model.point2 = new Packet(models.read("ob_point2.dat"));
      Model.point3 = new Packet(models.read("ob_point3.dat"));
      Model.point4 = new Packet(models.read("ob_point4.dat"));
      Model.point5 = new Packet(models.read("ob_point5.dat"));
      Model.vertex1 = new Packet(models.read("ob_vertex1.dat"));
      Model.vertex2 = new Packet(models.read("ob_vertex2.dat"));
      Model.axis = new Packet(models.read("ob_axis.dat"));
      Model.head.pos = 0;
      Model.point1.pos = 0;
      Model.point2.pos = 0;
      Model.point3.pos = 0;
      Model.point4.pos = 0;
      Model.vertex1.pos = 0;
      Model.vertex2.pos = 0;
      const count = Model.head.g2();
      Model.meta = new TypedArray1d(count + 100, null);
      let faceTextureAxisOffset = 0;
      let vertexLabelOffset = 0;
      let faceColourOffset = 0;
      let faceRenderTypeOffset = 0;
      let facePriorityOffset = 0;
      let faceAlphaOffset = 0;
      let faceLabelOffset = 0;
      for (let i = 0;i < count; i++) {
        const id = Model.head.g2();
        const meta = new Metadata;
        meta.numPoints = Model.head.g2();
        meta.numFaces = Model.head.g2();
        meta.numT = Model.head.g1();
        meta.vertexOrderOffset = Model.point1.pos;
        meta.vertexXOffset = Model.point2.pos;
        meta.vertexYOffset = Model.point3.pos;
        meta.vertexZOffset = Model.point4.pos;
        meta.faceIndexOffset = Model.vertex1.pos;
        meta.faceIndexOrderOffset = Model.vertex2.pos;
        const hasInfo = Model.head.g1();
        const priority = Model.head.g1();
        const hasAlpha = Model.head.g1();
        const hasSkins = Model.head.g1();
        const hasLabels = Model.head.g1();
        for (let v = 0;v < meta.numPoints; v++) {
          const flags = Model.point1.g1();
          if ((flags & 1) !== 0) {
            Model.point2.gsmarts();
          }
          if ((flags & 2) !== 0) {
            Model.point3.gsmarts();
          }
          if ((flags & 4) !== 0) {
            Model.point4.gsmarts();
          }
        }
        for (let v = 0;v < meta.numFaces; v++) {
          const type = Model.vertex2.g1();
          if (type === 1) {
            Model.vertex1.gsmarts();
            Model.vertex1.gsmarts();
          }
          Model.vertex1.gsmarts();
        }
        meta.faceColourOffset = faceColourOffset;
        faceColourOffset += meta.numFaces * 2;
        if (hasInfo === 1) {
          meta.faceRenderTypeOffset = faceRenderTypeOffset;
          faceRenderTypeOffset += meta.numFaces;
        }
        if (priority === 255) {
          meta.facePriorityOffset = facePriorityOffset;
          facePriorityOffset += meta.numFaces;
        } else {
          meta.facePriorityOffset = -priority - 1;
        }
        if (hasAlpha === 1) {
          meta.faceAlphaOffset = faceAlphaOffset;
          faceAlphaOffset += meta.numFaces;
        }
        if (hasSkins === 1) {
          meta.faceLabelOffset = faceLabelOffset;
          faceLabelOffset += meta.numFaces;
        }
        if (hasLabels === 1) {
          meta.vertexLabelOffset = vertexLabelOffset;
          vertexLabelOffset += meta.numPoints;
        }
        meta.faceTextureAxisOffset = faceTextureAxisOffset;
        faceTextureAxisOffset += meta.numT;
        Model.meta[id] = meta;
      }
    } catch (err) {
      console.log("Error loading model index");
      console.error(err);
    }
  }
  static load(id) {
    const meta = Model.meta[id];
    if (!meta) {
      console.error(`Error model:${id} not found!`);
      throw new Error;
    }
    if (!Model.head || !Model.face1 || !Model.face2 || !Model.face3 || !Model.face4 || !Model.face5 || !Model.point1 || !Model.point2 || !Model.point3 || !Model.point4 || !Model.point5 || !Model.vertex1 || !Model.vertex2 || !Model.axis) {
      throw new Error;
    }
    const model = new Model;
    model.numPoints = meta.numPoints;
    model.numFaces = meta.numFaces;
    model.numT = meta.numT;
    model.pointX = new Int32Array(model.numPoints);
    model.pointY = new Int32Array(model.numPoints);
    model.pointZ = new Int32Array(model.numPoints);
    model.faceVertexA = new Int32Array(model.numFaces);
    model.faceVertexB = new Int32Array(model.numFaces);
    model.faceVertexC = new Int32Array(model.numFaces);
    model.faceTextureP = new Int32Array(model.numT);
    model.faceTextureM = new Int32Array(model.numT);
    model.faceTextureN = new Int32Array(model.numT);
    if (meta.vertexLabelOffset >= 0) {
      model.vertexLabel = new Int32Array(model.numPoints);
    }
    if (meta.faceRenderTypeOffset >= 0) {
      model.faceRenderType = new Int32Array(model.numFaces);
    }
    if (meta.facePriorityOffset >= 0) {
      model.facePriority = new Int32Array(model.numFaces);
    } else {
      model.priority = -meta.facePriorityOffset - 1;
    }
    if (meta.faceAlphaOffset >= 0) {
      model.faceAlpha = new Int32Array(model.numFaces);
    }
    if (meta.faceLabelOffset >= 0) {
      model.faceLabel = new Int32Array(model.numFaces);
    }
    model.faceColour = new Int32Array(model.numFaces);
    Model.point1.pos = meta.vertexOrderOffset;
    Model.point2.pos = meta.vertexXOffset;
    Model.point3.pos = meta.vertexYOffset;
    Model.point4.pos = meta.vertexZOffset;
    Model.point5.pos = meta.vertexLabelOffset;
    let dx = 0;
    let dy = 0;
    let dz = 0;
    for (let v = 0;v < model.numPoints; v++) {
      const order = Model.point1.g1();
      let x = 0;
      if ((order & 1) !== 0) {
        x = Model.point2.gsmarts();
      }
      let y = 0;
      if ((order & 2) !== 0) {
        y = Model.point3.gsmarts();
      }
      let z = 0;
      if ((order & 4) !== 0) {
        z = Model.point4.gsmarts();
      }
      model.pointX[v] = dx + x;
      model.pointY[v] = dy + y;
      model.pointZ[v] = dz + z;
      dx = model.pointX[v];
      dy = model.pointY[v];
      dz = model.pointZ[v];
      if (model.vertexLabel !== null) {
        model.vertexLabel[v] = Model.point5.g1();
      }
    }
    Model.face1.pos = meta.faceColourOffset;
    Model.face2.pos = meta.faceRenderTypeOffset;
    Model.face3.pos = meta.facePriorityOffset;
    Model.face4.pos = meta.faceAlphaOffset;
    Model.face5.pos = meta.faceLabelOffset;
    for (let f = 0;f < model.numFaces; f++) {
      model.faceColour[f] = Model.face1.g2();
      if (model.faceRenderType !== null) {
        model.faceRenderType[f] = Model.face2.g1();
      }
      if (model.facePriority !== null) {
        model.facePriority[f] = Model.face3.g1();
      }
      if (model.faceAlpha !== null) {
        model.faceAlpha[f] = Model.face4.g1();
      }
      if (model.faceLabel !== null) {
        model.faceLabel[f] = Model.face5.g1();
      }
    }
    Model.vertex1.pos = meta.faceIndexOffset;
    Model.vertex2.pos = meta.faceIndexOrderOffset;
    let a = 0;
    let b = 0;
    let c = 0;
    let last = 0;
    for (let f = 0;f < model.numFaces; f++) {
      const order = Model.vertex2.g1();
      if (order === 1) {
        a = Model.vertex1.gsmarts() + last;
        b = Model.vertex1.gsmarts() + a;
        c = Model.vertex1.gsmarts() + b;
        last = c;
      } else if (order === 2) {
        b = c;
        c = Model.vertex1.gsmarts() + last;
        last = c;
      } else if (order === 3) {
        a = c;
        c = Model.vertex1.gsmarts() + last;
        last = c;
      } else if (order === 4) {
        const tmp = a;
        a = b;
        b = tmp;
        c = Model.vertex1.gsmarts() + last;
        last = c;
      }
      model.faceVertexA[f] = a;
      model.faceVertexB[f] = b;
      model.faceVertexC[f] = c;
    }
    Model.axis.pos = meta.faceTextureAxisOffset * 6;
    for (let f = 0;f < model.numT; f++) {
      model.faceTextureP[f] = Model.axis.g2();
      model.faceTextureM[f] = Model.axis.g2();
      model.faceTextureN[f] = Model.axis.g2();
    }
    return model;
  }
  static combineForAnim(models, count) {
    const combined = new Model;
    let copyRenderType = false;
    let copyPriority = false;
    let copyAlpha = false;
    let copyLabels = false;
    combined.numPoints = 0;
    combined.numFaces = 0;
    combined.numT = 0;
    combined.priority = -1;
    for (let i = 0;i < count; i++) {
      const model = models[i];
      if (model !== null) {
        combined.numPoints += model.numPoints;
        combined.numFaces += model.numFaces;
        combined.numT += model.numT;
        if (model.faceRenderType !== null) {
          copyRenderType = true;
        }
        if (model.facePriority === null) {
          if (combined.priority === -1) {
            combined.priority = model.priority;
          }
          if (combined.priority !== model.priority) {
            copyPriority = true;
          }
        } else {
          copyPriority = true;
        }
        if (model.faceAlpha !== null) {
          copyAlpha = true;
        }
        if (model.faceLabel !== null) {
          copyLabels = true;
        }
      }
    }
    combined.pointX = new Int32Array(combined.numPoints);
    combined.pointY = new Int32Array(combined.numPoints);
    combined.pointZ = new Int32Array(combined.numPoints);
    combined.vertexLabel = new Int32Array(combined.numPoints);
    combined.faceVertexA = new Int32Array(combined.numFaces);
    combined.faceVertexB = new Int32Array(combined.numFaces);
    combined.faceVertexC = new Int32Array(combined.numFaces);
    combined.faceTextureP = new Int32Array(combined.numT);
    combined.faceTextureM = new Int32Array(combined.numT);
    combined.faceTextureN = new Int32Array(combined.numT);
    if (copyRenderType) {
      combined.faceRenderType = new Int32Array(combined.numFaces);
    }
    if (copyPriority) {
      combined.facePriority = new Int32Array(combined.numFaces);
    }
    if (copyAlpha) {
      combined.faceAlpha = new Int32Array(combined.numFaces);
    }
    if (copyLabels) {
      combined.faceLabel = new Int32Array(combined.numFaces);
    }
    combined.faceColour = new Int32Array(combined.numFaces);
    combined.numPoints = 0;
    combined.numFaces = 0;
    combined.numT = 0;
    for (let i = 0;i < count; i++) {
      const model = models[i];
      if (model !== null) {
        for (let f = 0;f < model.numFaces; f++) {
          if (copyRenderType) {
            if (model.faceRenderType === null) {
              if (combined.faceRenderType) {
                combined.faceRenderType[combined.numFaces] = 0;
              }
            } else {
              if (combined.faceRenderType) {
                combined.faceRenderType[combined.numFaces] = model.faceRenderType[f];
              }
            }
          }
          if (copyPriority) {
            if (model.facePriority === null) {
              if (combined.facePriority) {
                combined.facePriority[combined.numFaces] = model.priority;
              }
            } else {
              if (combined.facePriority) {
                combined.facePriority[combined.numFaces] = model.facePriority[f];
              }
            }
          }
          if (copyAlpha) {
            if (model.faceAlpha === null) {
              if (combined.faceAlpha) {
                combined.faceAlpha[combined.numFaces] = 0;
              }
            } else {
              if (combined.faceAlpha) {
                combined.faceAlpha[combined.numFaces] = model.faceAlpha[f];
              }
            }
          }
          if (copyLabels && model.faceLabel !== null) {
            combined.faceLabel[combined.numFaces] = model.faceLabel[f];
          }
          combined.faceColour[combined.numFaces] = model.faceColour[f];
          combined.faceVertexA[combined.numFaces] = combined.addPoint(model, model.faceVertexA[f]);
          combined.faceVertexB[combined.numFaces] = combined.addPoint(model, model.faceVertexB[f]);
          combined.faceVertexC[combined.numFaces] = combined.addPoint(model, model.faceVertexC[f]);
          combined.numFaces++;
        }
        for (let f = 0;f < model.numT; f++) {
          combined.faceTextureP[combined.numT] = combined.addPoint(model, model.faceTextureP[f]);
          combined.faceTextureM[combined.numT] = combined.addPoint(model, model.faceTextureM[f]);
          combined.faceTextureN[combined.numT] = combined.addPoint(model, model.faceTextureN[f]);
          combined.numT++;
        }
      }
    }
    return combined;
  }
  static combine(models, count) {
    const combined = new Model;
    let copyRenderType = false;
    let copyPriority = false;
    let copyAlpha = false;
    let copyColour = false;
    combined.numPoints = 0;
    combined.numFaces = 0;
    combined.numT = 0;
    combined.priority = -1;
    for (let i = 0;i < count; i++) {
      const model = models[i];
      if (model !== null) {
        combined.numPoints += model.numPoints;
        combined.numFaces += model.numFaces;
        combined.numT += model.numT;
        if (model.faceRenderType !== null) {
          copyRenderType = true;
        }
        if (model.facePriority === null) {
          if (combined.priority === -1) {
            combined.priority = model.priority;
          }
          if (combined.priority !== model.priority) {
            copyPriority = true;
          }
        } else {
          copyPriority = true;
        }
        if (model.faceAlpha !== null) {
          copyAlpha = true;
        }
        if (model.faceColour !== null) {
          copyColour = true;
        }
      }
    }
    combined.pointX = new Int32Array(combined.numPoints);
    combined.pointY = new Int32Array(combined.numPoints);
    combined.pointZ = new Int32Array(combined.numPoints);
    combined.faceVertexA = new Int32Array(combined.numFaces);
    combined.faceVertexB = new Int32Array(combined.numFaces);
    combined.faceVertexC = new Int32Array(combined.numFaces);
    combined.faceColourA = new Int32Array(combined.numFaces);
    combined.faceColourB = new Int32Array(combined.numFaces);
    combined.faceColourC = new Int32Array(combined.numFaces);
    combined.faceTextureP = new Int32Array(combined.numT);
    combined.faceTextureM = new Int32Array(combined.numT);
    combined.faceTextureN = new Int32Array(combined.numT);
    if (copyRenderType) {
      combined.faceRenderType = new Int32Array(combined.numFaces);
    }
    if (copyPriority) {
      combined.facePriority = new Int32Array(combined.numFaces);
    }
    if (copyAlpha) {
      combined.faceAlpha = new Int32Array(combined.numFaces);
    }
    if (copyColour) {
      combined.faceColour = new Int32Array(combined.numFaces);
    }
    combined.numPoints = 0;
    combined.numFaces = 0;
    combined.numT = 0;
    for (let i = 0;i < count; i++) {
      const model = models[i];
      if (model !== null) {
        const vertexCount = combined.numPoints;
        for (let v = 0;v < model.numPoints; v++) {
          combined.pointX[combined.numPoints] = model.pointX[v];
          combined.pointY[combined.numPoints] = model.pointY[v];
          combined.pointZ[combined.numPoints] = model.pointZ[v];
          combined.numPoints++;
        }
        for (let f = 0;f < model.numFaces; f++) {
          combined.faceVertexA[combined.numFaces] = model.faceVertexA[f] + vertexCount;
          combined.faceVertexB[combined.numFaces] = model.faceVertexB[f] + vertexCount;
          combined.faceVertexC[combined.numFaces] = model.faceVertexC[f] + vertexCount;
          combined.faceColourA[combined.numFaces] = model.faceColourA[f];
          combined.faceColourB[combined.numFaces] = model.faceColourB[f];
          combined.faceColourC[combined.numFaces] = model.faceColourC[f];
          if (copyRenderType) {
            if (model.faceRenderType === null) {
              if (combined.faceRenderType) {
                combined.faceRenderType[combined.numFaces] = 0;
              }
            } else {
              if (combined.faceRenderType) {
                combined.faceRenderType[combined.numFaces] = model.faceRenderType[f];
              }
            }
          }
          if (copyPriority) {
            if (model.facePriority === null) {
              if (combined.facePriority) {
                combined.facePriority[combined.numFaces] = model.priority;
              }
            } else {
              if (combined.facePriority) {
                combined.facePriority[combined.numFaces] = model.facePriority[f];
              }
            }
          }
          if (copyAlpha) {
            if (model.faceAlpha === null) {
              if (combined.faceAlpha) {
                combined.faceAlpha[combined.numFaces] = 0;
              }
            } else {
              combined.faceAlpha[combined.numFaces] = model.faceAlpha[f];
            }
          }
          if (copyColour && model.faceColour !== null) {
            combined.faceColour[combined.numFaces] = model.faceColour[f];
          }
          combined.numFaces++;
        }
        for (let f = 0;f < model.numT; f++) {
          combined.faceTextureP[combined.numT] = model.faceTextureP[f] + vertexCount;
          combined.faceTextureM[combined.numT] = model.faceTextureM[f] + vertexCount;
          combined.faceTextureN[combined.numT] = model.faceTextureN[f] + vertexCount;
          combined.numT++;
        }
      }
    }
    combined.calcBoundingCylinder();
    return combined;
  }
  static copyForAnim(src, shareColours, shareAlpha, shareVertices) {
    const model = new Model;
    model.numPoints = src.numPoints;
    model.numFaces = src.numFaces;
    model.numT = src.numT;
    if (shareVertices) {
      model.pointX = src.pointX;
      model.pointY = src.pointY;
      model.pointZ = src.pointZ;
    } else {
      model.pointX = new Int32Array(model.numPoints);
      model.pointY = new Int32Array(model.numPoints);
      model.pointZ = new Int32Array(model.numPoints);
      for (let v = 0;v < model.numPoints; v++) {
        model.pointX[v] = src.pointX[v];
        model.pointY[v] = src.pointY[v];
        model.pointZ[v] = src.pointZ[v];
      }
    }
    if (shareColours) {
      model.faceColour = src.faceColour;
    } else {
      model.faceColour = new Int32Array(model.numFaces);
      for (let f = 0;f < model.numFaces; f++) {
        model.faceColour[f] = src.faceColour[f];
      }
    }
    if (shareAlpha) {
      model.faceAlpha = src.faceAlpha;
    } else {
      model.faceAlpha = new Int32Array(model.numFaces);
      if (src.faceAlpha === null) {
        for (let f = 0;f < model.numFaces; f++) {
          model.faceAlpha[f] = 0;
        }
      } else {
        for (let f = 0;f < model.numFaces; f++) {
          model.faceAlpha[f] = src.faceAlpha[f];
        }
      }
    }
    model.vertexLabel = src.vertexLabel;
    model.faceLabel = src.faceLabel;
    model.faceRenderType = src.faceRenderType;
    model.faceVertexA = src.faceVertexA;
    model.faceVertexB = src.faceVertexB;
    model.faceVertexC = src.faceVertexC;
    model.facePriority = src.facePriority;
    model.priority = src.priority;
    model.faceTextureP = src.faceTextureP;
    model.faceTextureM = src.faceTextureM;
    model.faceTextureN = src.faceTextureN;
    return model;
  }
  static hillSkewCopy(src, copyVertexY, copyFaces) {
    const model = new Model;
    model.numPoints = src.numPoints;
    model.numFaces = src.numFaces;
    model.numT = src.numT;
    if (copyVertexY) {
      model.pointY = new Int32Array(model.numPoints);
      for (let v = 0;v < model.numPoints; v++) {
        model.pointY[v] = src.pointY[v];
      }
    } else {
      model.pointY = src.pointY;
    }
    if (copyFaces) {
      model.faceColourA = new Int32Array(model.numFaces);
      model.faceColourB = new Int32Array(model.numFaces);
      model.faceColourC = new Int32Array(model.numFaces);
      for (let f = 0;f < model.numFaces; f++) {
        model.faceColourA[f] = src.faceColourA[f];
        model.faceColourB[f] = src.faceColourB[f];
        model.faceColourC[f] = src.faceColourC[f];
      }
      model.faceRenderType = new Int32Array(model.numFaces);
      if (src.faceRenderType === null) {
        for (let f = 0;f < model.numFaces; f++) {
          model.faceRenderType[f] = 0;
        }
      } else {
        for (let f = 0;f < model.numFaces; f++) {
          model.faceRenderType[f] = src.faceRenderType[f];
        }
      }
      model.pointNormal = new TypedArray1d(model.numPoints, null);
      for (let v = 0;v < model.numPoints; v++) {
        const normal = model.pointNormal[v] = new PointNormal;
        const original = src.pointNormal[v];
        normal.x = original.x;
        normal.y = original.y;
        normal.z = original.z;
        normal.w = original.w;
      }
      model.sharedPointNormal = src.sharedPointNormal;
    } else {
      model.faceColourA = src.faceColourA;
      model.faceColourB = src.faceColourB;
      model.faceColourC = src.faceColourC;
      model.faceRenderType = src.faceRenderType;
    }
    model.pointX = src.pointX;
    model.pointZ = src.pointZ;
    model.faceColour = src.faceColour;
    model.faceAlpha = src.faceAlpha;
    model.facePriority = src.facePriority;
    model.priority = src.priority;
    model.faceVertexA = src.faceVertexA;
    model.faceVertexB = src.faceVertexB;
    model.faceVertexC = src.faceVertexC;
    model.faceTextureP = src.faceTextureP;
    model.faceTextureM = src.faceTextureM;
    model.faceTextureN = src.faceTextureN;
    model.minY = src.minY;
    model.maxY = src.maxY;
    model.radius = src.radius;
    model.minDepth = src.minDepth;
    model.maxDepth = src.maxDepth;
    model.minX = src.minX;
    model.maxZ = src.maxZ;
    model.minZ = src.minZ;
    model.maxX = src.maxX;
    return model;
  }
  static set(src, shareAlpha) {
    const model = new Model;
    model.numPoints = src.numPoints;
    model.numFaces = src.numFaces;
    model.numT = src.numT;
    model.pointX = new Int32Array(model.numPoints);
    model.pointY = new Int32Array(model.numPoints);
    model.pointZ = new Int32Array(model.numPoints);
    for (let v = 0;v < model.numPoints; v++) {
      model.pointX[v] = src.pointX[v];
      model.pointY[v] = src.pointY[v];
      model.pointZ[v] = src.pointZ[v];
    }
    if (shareAlpha) {
      model.faceAlpha = src.faceAlpha;
    } else {
      model.faceAlpha = new Int32Array(model.numFaces);
      if (!src.faceAlpha) {
        for (let f = 0;f < model.numFaces; f++) {
          model.faceAlpha[f] = 0;
        }
      } else {
        for (let f = 0;f < model.numFaces; f++) {
          model.faceAlpha[f] = src.faceAlpha[f];
        }
      }
    }
    model.faceRenderType = src.faceRenderType;
    model.faceColour = src.faceColour;
    model.facePriority = src.facePriority;
    model.priority = src.priority;
    model.labelFaces = src.labelFaces;
    model.labelVertices = src.labelVertices;
    model.faceVertexA = src.faceVertexA;
    model.faceVertexB = src.faceVertexB;
    model.faceVertexC = src.faceVertexC;
    model.faceColourA = src.faceColourA;
    model.faceColourB = src.faceColourB;
    model.faceColourC = src.faceColourC;
    model.faceTextureP = src.faceTextureP;
    model.faceTextureM = src.faceTextureM;
    model.faceTextureN = src.faceTextureN;
    return model;
  }
  addPoint(src, vertex) {
    let index = -1;
    const x = src.pointX[vertex];
    const y = src.pointY[vertex];
    const z = src.pointZ[vertex];
    for (let v = 0;v < this.numPoints; v++) {
      if (this.pointX[v] === x && this.pointY[v] === y && this.pointZ[v] === z) {
        index = v;
        break;
      }
    }
    if (index === -1) {
      this.pointX[this.numPoints] = x;
      this.pointY[this.numPoints] = y;
      this.pointZ[this.numPoints] = z;
      if (src.vertexLabel !== null) {
        this.vertexLabel[this.numPoints] = src.vertexLabel[vertex];
      }
      index = this.numPoints++;
    }
    return index;
  }
  calcBoundingCylinder() {
    this.minY = 0;
    this.radius = 0;
    this.maxY = 0;
    for (let i = 0;i < this.numPoints; i++) {
      const x = this.pointX[i];
      const y = this.pointY[i];
      const z = this.pointZ[i];
      if (-y > this.minY) {
        this.minY = -y;
      }
      if (y > this.maxY) {
        this.maxY = y;
      }
      const radiusSqr = x * x + z * z;
      if (radiusSqr > this.radius) {
        this.radius = radiusSqr;
      }
    }
    this.radius = Math.sqrt(this.radius) + 0.99 | 0;
    this.minDepth = Math.sqrt(this.radius * this.radius + this.minY * this.minY) + 0.99 | 0;
    this.maxDepth = this.minDepth + (Math.sqrt(this.radius * this.radius + this.maxY * this.maxY) + 0.99 | 0);
  }
  recalcBoundingCylinder() {
    this.minY = 0;
    this.maxY = 0;
    for (let i = 0;i < this.numPoints; i++) {
      const y = this.pointY[i];
      if (-y > this.minY) {
        this.minY = -y;
      }
      if (y > this.maxY) {
        this.maxY = y;
      }
    }
    this.minDepth = Math.sqrt(this.radius * this.radius + this.minY * this.minY) + 0.99 | 0;
    this.maxDepth = this.minDepth + (Math.sqrt(this.radius * this.radius + this.maxY * this.maxY) + 0.99 | 0);
  }
  calcBoundingCube() {
    this.minY = 0;
    this.radius = 0;
    this.maxY = 0;
    this.minX = 999999;
    this.maxX = -999999;
    this.maxZ = -99999;
    this.minZ = 99999;
    for (let v = 0;v < this.numPoints; v++) {
      const x = this.pointX[v];
      const y = this.pointY[v];
      const z = this.pointZ[v];
      if (x < this.minX) {
        this.minX = x;
      }
      if (x > this.maxX) {
        this.maxX = x;
      }
      if (z < this.minZ) {
        this.minZ = z;
      }
      if (z > this.maxZ) {
        this.maxZ = z;
      }
      if (-y > this.minY) {
        this.minY = -y;
      }
      if (y > this.maxY) {
        this.maxY = y;
      }
      const radiusSqr = x * x + z * z;
      if (radiusSqr > this.radius) {
        this.radius = radiusSqr;
      }
    }
    this.radius = Math.sqrt(this.radius) | 0;
    this.minDepth = Math.sqrt(this.radius * this.radius + this.minY * this.minY) | 0;
    this.maxDepth = this.minDepth + (Math.sqrt(this.radius * this.radius + this.maxY * this.maxY) | 0);
  }
  prepareAnim() {
    if (this.vertexLabel) {
      const labelVertexCount = new Int32Array(256);
      let count = 0;
      for (let v2 = 0;v2 < this.numPoints; v2++) {
        const label = this.vertexLabel[v2];
        labelVertexCount[label]++;
        if (label > count) {
          count = label;
        }
      }
      this.labelVertices = new TypedArray1d(count + 1, null);
      for (let label = 0;label <= count; label++) {
        this.labelVertices[label] = new Int32Array(labelVertexCount[label]);
        labelVertexCount[label] = 0;
      }
      let v = 0;
      while (v < this.numPoints) {
        const label = this.vertexLabel[v];
        const verts = this.labelVertices[label];
        if (!verts) {
          continue;
        }
        verts[labelVertexCount[label]++] = v++;
      }
      this.vertexLabel = null;
    }
    if (this.faceLabel) {
      const labelFaceCount = new Int32Array(256);
      let count = 0;
      for (let f = 0;f < this.numFaces; f++) {
        const label = this.faceLabel[f];
        labelFaceCount[label]++;
        if (label > count) {
          count = label;
        }
      }
      this.labelFaces = new TypedArray1d(count + 1, null);
      for (let label = 0;label <= count; label++) {
        this.labelFaces[label] = new Int32Array(labelFaceCount[label]);
        labelFaceCount[label] = 0;
      }
      let face = 0;
      while (face < this.numFaces) {
        const label = this.faceLabel[face];
        const faces = this.labelFaces[label];
        if (!faces) {
          continue;
        }
        faces[labelFaceCount[label]++] = face++;
      }
      this.faceLabel = null;
    }
  }
  animate(id) {
    if (!this.labelVertices || id === -1) {
      return;
    }
    const transform = AnimFrame.list[id];
    if (!transform) {
      return;
    }
    const base = transform.base;
    Model.oX = 0;
    Model.oY = 0;
    Model.oZ = 0;
    for (let i = 0;i < transform.size; i++) {
      if (!transform.ti || !transform.tx || !transform.ty || !transform.tz || !base || !base.labels || !base.type) {
        continue;
      }
      const ti = transform.ti[i];
      this.animate2(transform.tx[i], transform.ty[i], transform.tz[i], base.labels[ti], base.type[ti]);
    }
  }
  maskAnimate(primaryId, secondaryId, mask) {
    if (primaryId === -1) {
      return;
    }
    if (!mask || secondaryId === -1) {
      this.animate(primaryId);
      return;
    }
    const primary = AnimFrame.list[primaryId];
    if (!primary) {
      return;
    }
    const secondary = AnimFrame.list[secondaryId];
    if (!secondary) {
      this.animate(primaryId);
      return;
    }
    const skeleton = primary.base;
    Model.oX = 0;
    Model.oY = 0;
    Model.oZ = 0;
    let counter = 0;
    let maskBase = mask[counter++];
    for (let i = 0;i < primary.size; i++) {
      if (!primary.ti) {
        continue;
      }
      const base = primary.ti[i];
      while (base > maskBase) {
        maskBase = mask[counter++];
      }
      if (skeleton && skeleton.type && primary.tx && primary.ty && primary.tz && skeleton.labels && (base !== maskBase || skeleton.type[base] === 0)) {
        this.animate2(primary.tx[i], primary.ty[i], primary.tz[i], skeleton.labels[base], skeleton.type[base]);
      }
    }
    Model.oX = 0;
    Model.oY = 0;
    Model.oZ = 0;
    counter = 0;
    maskBase = mask[counter++];
    for (let i = 0;i < secondary.size; i++) {
      if (!secondary.ti) {
        continue;
      }
      const base = secondary.ti[i];
      while (base > maskBase) {
        maskBase = mask[counter++];
      }
      if (skeleton && skeleton.type && secondary.tx && secondary.ty && secondary.tz && skeleton.labels && (base === maskBase || skeleton.type[base] === 0)) {
        this.animate2(secondary.tx[i], secondary.ty[i], secondary.tz[i], skeleton.labels[base], skeleton.type[base]);
      }
    }
  }
  animate2(x, y, z, labels, type) {
    if (!labels) {
      return;
    }
    const labelCount = labels.length;
    if (type === 0 /* ORIGIN */) {
      let count = 0;
      Model.oX = 0;
      Model.oY = 0;
      Model.oZ = 0;
      for (let g = 0;g < labelCount; g++) {
        if (!this.labelVertices) {
          continue;
        }
        const label = labels[g];
        if (label < this.labelVertices.length) {
          const vertices = this.labelVertices[label];
          if (vertices) {
            for (let i = 0;i < vertices.length; i++) {
              const v = vertices[i];
              Model.oX += this.pointX[v];
              Model.oY += this.pointY[v];
              Model.oZ += this.pointZ[v];
              count++;
            }
          }
        }
      }
      if (count > 0) {
        Model.oX = (Model.oX / count | 0) + x;
        Model.oY = (Model.oY / count | 0) + y;
        Model.oZ = (Model.oZ / count | 0) + z;
      } else {
        Model.oX = x;
        Model.oY = y;
        Model.oZ = z;
      }
    } else if (type === 1 /* TRANSLATE */) {
      for (let g = 0;g < labelCount; g++) {
        const group = labels[g];
        if (!this.labelVertices || group >= this.labelVertices.length) {
          continue;
        }
        const vertices = this.labelVertices[group];
        if (vertices) {
          for (let i = 0;i < vertices.length; i++) {
            const v = vertices[i];
            this.pointX[v] += x;
            this.pointY[v] += y;
            this.pointZ[v] += z;
          }
        }
      }
    } else if (type === 2 /* ROTATE */) {
      for (let g = 0;g < labelCount; g++) {
        const label = labels[g];
        if (!this.labelVertices || label >= this.labelVertices.length) {
          continue;
        }
        const vertices = this.labelVertices[label];
        if (vertices) {
          for (let i = 0;i < vertices.length; i++) {
            const v = vertices[i];
            this.pointX[v] -= Model.oX;
            this.pointY[v] -= Model.oY;
            this.pointZ[v] -= Model.oZ;
            const pitch = (x & 255) * 8;
            const yaw = (y & 255) * 8;
            const roll = (z & 255) * 8;
            let sin;
            let cos;
            if (roll !== 0) {
              sin = Pix3D.sinTable[roll];
              cos = Pix3D.cosTable[roll];
              const x_ = this.pointY[v] * sin + this.pointX[v] * cos >> 16;
              this.pointY[v] = this.pointY[v] * cos - this.pointX[v] * sin >> 16;
              this.pointX[v] = x_;
            }
            if (pitch !== 0) {
              sin = Pix3D.sinTable[pitch];
              cos = Pix3D.cosTable[pitch];
              const y_ = this.pointY[v] * cos - this.pointZ[v] * sin >> 16;
              this.pointZ[v] = this.pointY[v] * sin + this.pointZ[v] * cos >> 16;
              this.pointY[v] = y_;
            }
            if (yaw !== 0) {
              sin = Pix3D.sinTable[yaw];
              cos = Pix3D.cosTable[yaw];
              const x_ = this.pointZ[v] * sin + this.pointX[v] * cos >> 16;
              this.pointZ[v] = this.pointZ[v] * cos - this.pointX[v] * sin >> 16;
              this.pointX[v] = x_;
            }
            this.pointX[v] += Model.oX;
            this.pointY[v] += Model.oY;
            this.pointZ[v] += Model.oZ;
          }
        }
      }
    } else if (type === 3 /* SCALE */) {
      for (let g = 0;g < labelCount; g++) {
        const label = labels[g];
        if (!this.labelVertices || label >= this.labelVertices.length) {
          continue;
        }
        const vertices = this.labelVertices[label];
        if (vertices) {
          for (let i = 0;i < vertices.length; i++) {
            const v = vertices[i];
            this.pointX[v] -= Model.oX;
            this.pointY[v] -= Model.oY;
            this.pointZ[v] -= Model.oZ;
            this.pointX[v] = this.pointX[v] * x / 128 | 0;
            this.pointY[v] = this.pointY[v] * y / 128 | 0;
            this.pointZ[v] = this.pointZ[v] * z / 128 | 0;
            this.pointX[v] += Model.oX;
            this.pointY[v] += Model.oY;
            this.pointZ[v] += Model.oZ;
          }
        }
      }
    } else if (type === 5 /* TRANSPARENCY */ && this.labelFaces && this.faceAlpha) {
      for (let g = 0;g < labelCount; g++) {
        const label = labels[g];
        if (label >= this.labelFaces.length) {
          continue;
        }
        const triangles = this.labelFaces[label];
        if (triangles) {
          for (let i = 0;i < triangles.length; i++) {
            const t = triangles[i];
            this.faceAlpha[t] += x * 8;
            if (this.faceAlpha[t] < 0) {
              this.faceAlpha[t] = 0;
            }
            if (this.faceAlpha[t] > 255) {
              this.faceAlpha[t] = 255;
            }
          }
        }
      }
    }
  }
  rotate90() {
    for (let v = 0;v < this.numPoints; v++) {
      const tmp = this.pointX[v];
      this.pointX[v] = this.pointZ[v];
      this.pointZ[v] = -tmp;
    }
  }
  rotateXAxis(angle) {
    const sin = Pix3D.sinTable[angle];
    const cos = Pix3D.cosTable[angle];
    for (let v = 0;v < this.numPoints; v++) {
      const tmp = this.pointY[v] * cos - this.pointZ[v] * sin >> 16;
      this.pointZ[v] = this.pointY[v] * sin + this.pointZ[v] * cos >> 16;
      this.pointY[v] = tmp;
    }
  }
  translate(y, x, z) {
    for (let v = 0;v < this.numPoints; v++) {
      this.pointX[v] += x;
      this.pointY[v] += y;
      this.pointZ[v] += z;
    }
  }
  recolour(src, dst) {
    if (!this.faceColour) {
      return;
    }
    for (let f = 0;f < this.numFaces; f++) {
      if (this.faceColour[f] === src) {
        this.faceColour[f] = dst;
      }
    }
  }
  mirror() {
    for (let v = 0;v < this.numPoints; v++) {
      this.pointZ[v] = -this.pointZ[v];
    }
    for (let f = 0;f < this.numFaces; f++) {
      const tmp = this.faceVertexA[f];
      this.faceVertexA[f] = this.faceVertexC[f];
      this.faceVertexC[f] = tmp;
    }
  }
  resize(x, y, z) {
    for (let v = 0;v < this.numPoints; v++) {
      this.pointX[v] = this.pointX[v] * x / 128 | 0;
      this.pointY[v] = this.pointY[v] * y / 128 | 0;
      this.pointZ[v] = this.pointZ[v] * z / 128 | 0;
    }
  }
  calculateNormals(ambient, contrast, x, y, z, doNotShareLight) {
    const lightMagnitude = Math.sqrt(x * x + y * y + z * z) | 0;
    const scale = contrast * lightMagnitude >> 8;
    if (!this.faceColourA || !this.faceColourB || !this.faceColourC) {
      this.faceColourA = new Int32Array(this.numFaces);
      this.faceColourB = new Int32Array(this.numFaces);
      this.faceColourC = new Int32Array(this.numFaces);
    }
    if (!this.pointNormal) {
      this.pointNormal = new TypedArray1d(this.numPoints, null);
      for (let v = 0;v < this.numPoints; v++) {
        this.pointNormal[v] = new PointNormal;
      }
    }
    for (let f = 0;f < this.numFaces; f++) {
      const a = this.faceVertexA[f];
      const b = this.faceVertexB[f];
      const c = this.faceVertexC[f];
      const dxAB = this.pointX[b] - this.pointX[a];
      const dyAB = this.pointY[b] - this.pointY[a];
      const dzAB = this.pointZ[b] - this.pointZ[a];
      const dxAC = this.pointX[c] - this.pointX[a];
      const dyAC = this.pointY[c] - this.pointY[a];
      const dzAC = this.pointZ[c] - this.pointZ[a];
      let nx = dyAB * dzAC - dyAC * dzAB;
      let ny = dzAB * dxAC - dzAC * dxAB;
      let nz = dxAB * dyAC - dxAC * dyAB;
      while (nx > 8192 || ny > 8192 || nz > 8192 || nx < -8192 || ny < -8192 || nz < -8192) {
        nx >>= 1;
        ny >>= 1;
        nz >>= 1;
      }
      let length = Math.sqrt(nx * nx + ny * ny + nz * nz) | 0;
      if (length <= 0) {
        length = 1;
      }
      nx = nx * 256 / length | 0;
      ny = ny * 256 / length | 0;
      nz = nz * 256 / length | 0;
      if (!this.faceRenderType || (this.faceRenderType[f] & 1) === 0) {
        let n = this.pointNormal[a];
        if (n) {
          n.x += nx;
          n.y += ny;
          n.z += nz;
          n.w++;
        }
        n = this.pointNormal[b];
        if (n) {
          n.x += nx;
          n.y += ny;
          n.z += nz;
          n.w++;
        }
        n = this.pointNormal[c];
        if (n) {
          n.x += nx;
          n.y += ny;
          n.z += nz;
          n.w++;
        }
      } else {
        const lightness = ambient + ((x * nx + y * ny + z * nz) / (scale + (scale / 2 | 0)) | 0);
        if (this.faceColour) {
          this.faceColourA[f] = Model.getColour(this.faceColour[f], lightness, this.faceRenderType[f]);
        }
      }
    }
    if (doNotShareLight) {
      this.light(ambient, scale, x, y, z);
    } else {
      this.sharedPointNormal = new TypedArray1d(this.numPoints, null);
      for (let v = 0;v < this.numPoints; v++) {
        const normal = this.pointNormal[v];
        const copy = new PointNormal;
        if (normal) {
          copy.x = normal.x;
          copy.y = normal.y;
          copy.z = normal.z;
          copy.w = normal.w;
        }
        this.sharedPointNormal[v] = copy;
      }
    }
    if (doNotShareLight) {
      this.calcBoundingCylinder();
    } else {
      this.calcBoundingCube();
    }
  }
  light(ambient, contrast, x, y, z) {
    for (let f = 0;f < this.numFaces; f++) {
      const a = this.faceVertexA[f];
      const b = this.faceVertexB[f];
      const c = this.faceVertexC[f];
      if (!this.faceRenderType && this.faceColour && this.pointNormal && this.faceColourA && this.faceColourB && this.faceColourC) {
        const colour = this.faceColour[f];
        const va = this.pointNormal[a];
        if (va) {
          this.faceColourA[f] = Model.getColour(colour, ambient + ((x * va.x + y * va.y + z * va.z) / (contrast * va.w) | 0), 0);
        }
        const vb = this.pointNormal[b];
        if (vb) {
          this.faceColourB[f] = Model.getColour(colour, ambient + ((x * vb.x + y * vb.y + z * vb.z) / (contrast * vb.w) | 0), 0);
        }
        const vc = this.pointNormal[c];
        if (vc) {
          this.faceColourC[f] = Model.getColour(colour, ambient + ((x * vc.x + y * vc.y + z * vc.z) / (contrast * vc.w) | 0), 0);
        }
      } else if (this.faceRenderType && (this.faceRenderType[f] & 1) === 0 && this.faceColour && this.pointNormal && this.faceColourA && this.faceColourB && this.faceColourC) {
        const colour = this.faceColour[f];
        const info = this.faceRenderType[f];
        const va = this.pointNormal[a];
        if (va) {
          this.faceColourA[f] = Model.getColour(colour, ambient + ((x * va.x + y * va.y + z * va.z) / (contrast * va.w) | 0), info);
        }
        const vb = this.pointNormal[b];
        if (vb) {
          this.faceColourB[f] = Model.getColour(colour, ambient + ((x * vb.x + y * vb.y + z * vb.z) / (contrast * vb.w) | 0), info);
        }
        const vc = this.pointNormal[c];
        if (vc) {
          this.faceColourC[f] = Model.getColour(colour, ambient + ((x * vc.x + y * vc.y + z * vc.z) / (contrast * vc.w) | 0), info);
        }
      }
    }
    this.pointNormal = null;
    this.sharedPointNormal = null;
    this.vertexLabel = null;
    this.faceLabel = null;
    if (this.faceRenderType) {
      for (let f = 0;f < this.numFaces; f++) {
        if ((this.faceRenderType[f] & 2) === 2) {
          return;
        }
      }
    }
    this.faceColour = null;
  }
  static getColour(hsl, scalar, faceRenderType) {
    if ((faceRenderType & 2) === 2) {
      if (scalar < 0) {
        scalar = 0;
      } else if (scalar > 127) {
        scalar = 127;
      }
      return 127 - scalar;
    } else {
      scalar = scalar * (hsl & 127) >> 7;
      if (scalar < 2) {
        scalar = 2;
      } else if (scalar > 126) {
        scalar = 126;
      }
      return (hsl & 65408) + scalar;
    }
  }
  objRender(pitch, yaw, roll, eyePitch, eyeX, eyeY, eyeZ) {
    const sinPitch = Pix3D.sinTable[pitch];
    const cosPitch = Pix3D.cosTable[pitch];
    const sinYaw = Pix3D.sinTable[yaw];
    const cosYaw = Pix3D.cosTable[yaw];
    const sinRoll = Pix3D.sinTable[roll];
    const cosRoll = Pix3D.cosTable[roll];
    const sinEyePitch = Pix3D.sinTable[eyePitch];
    const cosEyePitch = Pix3D.cosTable[eyePitch];
    const midZ = eyeY * sinEyePitch + eyeZ * cosEyePitch >> 16;
    for (let v = 0;v < this.numPoints; v++) {
      let x = this.pointX[v];
      let y = this.pointY[v];
      let z = this.pointZ[v];
      let tmp;
      if (roll !== 0) {
        tmp = y * sinRoll + x * cosRoll >> 16;
        y = y * cosRoll - x * sinRoll >> 16;
        x = tmp;
      }
      if (pitch !== 0) {
        tmp = y * cosPitch - z * sinPitch >> 16;
        z = y * sinPitch + z * cosPitch >> 16;
        y = tmp;
      }
      if (yaw !== 0) {
        tmp = z * sinYaw + x * cosYaw >> 16;
        z = z * cosYaw - x * sinYaw >> 16;
        x = tmp;
      }
      x += eyeX;
      y += eyeY;
      z += eyeZ;
      tmp = y * cosEyePitch - z * sinEyePitch >> 16;
      z = y * sinEyePitch + z * cosEyePitch >> 16;
      y = tmp;
      Model.vertexScreenZ[v] = z - midZ;
      Model.vertexScreenX[v] = Pix3D.originX + ((x << 9) / z | 0);
      Model.vertexScreenY[v] = Pix3D.originY + ((y << 9) / z | 0);
      if (this.numT > 0) {
        Model.vertexViewSpaceX[v] = x;
        Model.vertexViewSpaceY[v] = y;
        Model.vertexViewSpaceZ[v] = z;
      }
    }
    try {
      this.render2(false, false, 0);
    } catch (_e) {}
  }
  worldRender(yaw, sinEyePitch, cosEyePitch, sinEyeYaw, cosEyeYaw, relativeX, relativeY, relativeZ, typecode) {
    const zPrime = relativeZ * cosEyeYaw - relativeX * sinEyeYaw >> 16;
    const midZ = relativeY * sinEyePitch + zPrime * cosEyePitch >> 16;
    const radiusCosEyePitch = this.radius * cosEyePitch >> 16;
    const maxZ = midZ + radiusCosEyePitch;
    if (maxZ <= 50 || midZ >= 3500) {
      return;
    }
    const midX = relativeZ * sinEyeYaw + relativeX * cosEyeYaw >> 16;
    let leftX = midX - this.radius << 9;
    if ((leftX / maxZ | 0) >= Pix2D.maxX) {
      return;
    }
    let rightX = midX + this.radius << 9;
    if ((rightX / maxZ | 0) <= -Pix2D.maxX) {
      return;
    }
    const midY = relativeY * cosEyePitch - zPrime * sinEyePitch >> 16;
    const radiusSinEyePitch = this.radius * sinEyePitch >> 16;
    let bottomY = midY + radiusSinEyePitch << 9;
    if ((bottomY / maxZ | 0) <= -Pix2D.maxY) {
      return;
    }
    const yPrime = radiusSinEyePitch + (this.minY * cosEyePitch >> 16);
    let topY = midY - yPrime << 9;
    if ((topY / maxZ | 0) >= Pix2D.maxY) {
      return;
    }
    const radiusZ = radiusCosEyePitch + (this.minY * sinEyePitch >> 16);
    let clipped = midZ - radiusZ <= 50;
    let picking = false;
    if (typecode > 0 && Model.mouseCheck) {
      let z = midZ - radiusCosEyePitch;
      if (z <= 50) {
        z = 50;
      }
      if (midX > 0) {
        leftX = leftX / maxZ | 0;
        rightX = rightX / z | 0;
      } else {
        rightX = rightX / maxZ | 0;
        leftX = leftX / z | 0;
      }
      if (midY > 0) {
        topY = topY / maxZ | 0;
        bottomY = bottomY / z | 0;
      } else {
        bottomY = bottomY / maxZ | 0;
        topY = topY / z | 0;
      }
      const mouseX = Model.mouseX - Pix3D.originX;
      const mouseY = Model.mouseY - Pix3D.originY;
      if (mouseX > leftX && mouseX < rightX && mouseY > topY && mouseY < bottomY) {
        if (this.useAABBMouseCheck) {
          Model.pickedEntityTypecode[Model.pickedCount++] = typecode;
        } else {
          picking = true;
        }
      }
    }
    const centerX = Pix3D.originX;
    const centerY = Pix3D.originY;
    let sinYaw = 0;
    let cosYaw = 0;
    if (yaw !== 0) {
      sinYaw = Pix3D.sinTable[yaw];
      cosYaw = Pix3D.cosTable[yaw];
    }
    for (let v = 0;v < this.numPoints; v++) {
      let x = this.pointX[v];
      let y = this.pointY[v];
      let z = this.pointZ[v];
      let temp;
      if (yaw !== 0) {
        temp = z * sinYaw + x * cosYaw >> 16;
        z = z * cosYaw - x * sinYaw >> 16;
        x = temp;
      }
      x += relativeX;
      y += relativeY;
      z += relativeZ;
      temp = z * sinEyeYaw + x * cosEyeYaw >> 16;
      z = z * cosEyeYaw - x * sinEyeYaw >> 16;
      x = temp;
      temp = y * cosEyePitch - z * sinEyePitch >> 16;
      z = y * sinEyePitch + z * cosEyePitch >> 16;
      y = temp;
      Model.vertexScreenZ[v] = z - midZ;
      if (z >= 50) {
        Model.vertexScreenX[v] = centerX + ((x << 9) / z | 0);
        Model.vertexScreenY[v] = centerY + ((y << 9) / z | 0);
      } else {
        Model.vertexScreenX[v] = -5000;
        clipped = true;
      }
      if (clipped || this.numT > 0) {
        Model.vertexViewSpaceX[v] = x;
        Model.vertexViewSpaceY[v] = y;
        Model.vertexViewSpaceZ[v] = z;
      }
    }
    try {
      this.render2(clipped, picking, typecode);
    } catch (_e) {}
  }
  render2(clipped, picking, typecode) {
    for (let depth = 0;depth < this.maxDepth; depth++) {
      Model.tmpDepthFaceCount[depth] = 0;
    }
    for (let f = 0;f < this.numFaces; f++) {
      if (this.faceRenderType && this.faceRenderType[f] === -1) {
        continue;
      }
      const a = this.faceVertexA[f];
      const b = this.faceVertexB[f];
      const c = this.faceVertexC[f];
      const xA = Model.vertexScreenX[a];
      const xB = Model.vertexScreenX[b];
      const xC = Model.vertexScreenX[c];
      const yA = Model.vertexScreenY[a];
      const yB = Model.vertexScreenY[b];
      const yC = Model.vertexScreenY[c];
      const zA = Model.vertexScreenZ[a];
      const zB = Model.vertexScreenZ[b];
      const zC = Model.vertexScreenZ[c];
      if (clipped && (xA === -5000 || xB === -5000 || xC === -5000)) {
        Model.faceNearClipped[f] = true;
        const depthAverage = ((zA + zB + zC) / 3 | 0) + this.minDepth;
        Model.tmpDepthFaces[depthAverage][Model.tmpDepthFaceCount[depthAverage]++] = f;
      } else {
        if (picking && this.isMouseRoughlyInsideTriangle(Model.mouseX, Model.mouseY, yA, yB, yC, xA, xB, xC)) {
          Model.pickedEntityTypecode[Model.pickedCount++] = typecode;
          picking = false;
        }
        const dxAB = xA - xB;
        const dyAB = yA - yB;
        const dxCB = xC - xB;
        const dyCB = yC - yB;
        if (dxAB * dyCB - dyAB * dxCB <= 0) {
          continue;
        }
        Model.faceNearClipped[f] = false;
        Model.faceClippedX[f] = xA < 0 || xB < 0 || xC < 0 || xA > Pix2D.sizeX || xB > Pix2D.sizeX || xC > Pix2D.sizeX;
        const depthAverage = ((zA + zB + zC) / 3 | 0) + this.minDepth;
        Model.tmpDepthFaces[depthAverage][Model.tmpDepthFaceCount[depthAverage]++] = f;
      }
    }
    if (!this.facePriority) {
      for (let depth = this.maxDepth - 1;depth >= 0; depth--) {
        const count = Model.tmpDepthFaceCount[depth];
        if (count <= 0) {
          continue;
        }
        const faces = Model.tmpDepthFaces[depth];
        for (let f = 0;f < count; f++) {
          try {
            this.render3(faces[f]);
          } catch (_e) {}
        }
      }
      return;
    }
    for (let priority = 0;priority < 12; priority++) {
      Model.tmpPriorityFaceCount[priority] = 0;
      Model.tmpPriorityDepthSum[priority] = 0;
    }
    for (let depth = this.maxDepth - 1;depth >= 0; depth--) {
      const faceCount = Model.tmpDepthFaceCount[depth];
      if (faceCount > 0) {
        const faces = Model.tmpDepthFaces[depth];
        for (let i = 0;i < faceCount; i++) {
          const priorityDepth2 = faces[i];
          const priorityFace2 = this.facePriority[priorityDepth2];
          const priorityFaceCount2 = Model.tmpPriorityFaceCount[priorityFace2]++;
          Model.tmpPriorityFaces[priorityFace2][priorityFaceCount2] = priorityDepth2;
          if (priorityFace2 < 10) {
            Model.tmpPriorityDepthSum[priorityFace2] += depth;
          } else if (priorityFace2 === 10) {
            Model.tmpPriority10FaceDepth[priorityFaceCount2] = depth;
          } else {
            Model.tmpPriority11FaceDepth[priorityFaceCount2] = depth;
          }
        }
      }
    }
    let averagePriorityDepthSum1_2 = 0;
    if (Model.tmpPriorityFaceCount[1] > 0 || Model.tmpPriorityFaceCount[2] > 0) {
      averagePriorityDepthSum1_2 = (Model.tmpPriorityDepthSum[1] + Model.tmpPriorityDepthSum[2]) / (Model.tmpPriorityFaceCount[1] + Model.tmpPriorityFaceCount[2]) | 0;
    }
    let averagePriorityDepthSum3_4 = 0;
    if (Model.tmpPriorityFaceCount[3] > 0 || Model.tmpPriorityFaceCount[4] > 0) {
      averagePriorityDepthSum3_4 = (Model.tmpPriorityDepthSum[3] + Model.tmpPriorityDepthSum[4]) / (Model.tmpPriorityFaceCount[3] + Model.tmpPriorityFaceCount[4]) | 0;
    }
    let averagePriorityDepthSum6_8 = 0;
    if (Model.tmpPriorityFaceCount[6] > 0 || Model.tmpPriorityFaceCount[8] > 0) {
      averagePriorityDepthSum6_8 = (Model.tmpPriorityDepthSum[6] + Model.tmpPriorityDepthSum[8]) / (Model.tmpPriorityFaceCount[6] + Model.tmpPriorityFaceCount[8]) | 0;
    }
    let priorityFace = 0;
    let priorityFaceCount = Model.tmpPriorityFaceCount[10];
    let priorityFaces = Model.tmpPriorityFaces[10];
    let priorityFaceDepths = Model.tmpPriority10FaceDepth;
    if (priorityFace === priorityFaceCount) {
      priorityFace = 0;
      priorityFaceCount = Model.tmpPriorityFaceCount[11];
      priorityFaces = Model.tmpPriorityFaces[11];
      priorityFaceDepths = Model.tmpPriority11FaceDepth;
    }
    let priorityDepth;
    if (priorityFace < priorityFaceCount && priorityFaceDepths) {
      priorityDepth = priorityFaceDepths[priorityFace];
    } else {
      priorityDepth = -1000;
    }
    for (let priority = 0;priority < 10; priority++) {
      while (priority === 0 && priorityDepth > averagePriorityDepthSum1_2) {
        try {
          this.render3(priorityFaces[priorityFace++]);
          if (priorityFace === priorityFaceCount && priorityFaces !== Model.tmpPriorityFaces[11]) {
            priorityFace = 0;
            priorityFaceCount = Model.tmpPriorityFaceCount[11];
            priorityFaces = Model.tmpPriorityFaces[11];
            priorityFaceDepths = Model.tmpPriority11FaceDepth;
          }
          if (priorityFace < priorityFaceCount && priorityFaceDepths) {
            priorityDepth = priorityFaceDepths[priorityFace];
          } else {
            priorityDepth = -1000;
          }
        } catch (_e) {}
      }
      while (priority === 3 && priorityDepth > averagePriorityDepthSum3_4) {
        try {
          this.render3(priorityFaces[priorityFace++]);
          if (priorityFace === priorityFaceCount && priorityFaces !== Model.tmpPriorityFaces[11]) {
            priorityFace = 0;
            priorityFaceCount = Model.tmpPriorityFaceCount[11];
            priorityFaces = Model.tmpPriorityFaces[11];
            priorityFaceDepths = Model.tmpPriority11FaceDepth;
          }
          if (priorityFace < priorityFaceCount && priorityFaceDepths) {
            priorityDepth = priorityFaceDepths[priorityFace];
          } else {
            priorityDepth = -1000;
          }
        } catch (_e) {}
      }
      while (priority === 5 && priorityDepth > averagePriorityDepthSum6_8) {
        try {
          this.render3(priorityFaces[priorityFace++]);
          if (priorityFace === priorityFaceCount && priorityFaces !== Model.tmpPriorityFaces[11]) {
            priorityFace = 0;
            priorityFaceCount = Model.tmpPriorityFaceCount[11];
            priorityFaces = Model.tmpPriorityFaces[11];
            priorityFaceDepths = Model.tmpPriority11FaceDepth;
          }
          if (priorityFace < priorityFaceCount && priorityFaceDepths) {
            priorityDepth = priorityFaceDepths[priorityFace];
          } else {
            priorityDepth = -1000;
          }
        } catch (_e) {}
      }
      const count = Model.tmpPriorityFaceCount[priority];
      const faces = Model.tmpPriorityFaces[priority];
      for (let i = 0;i < count; i++) {
        try {
          this.render3(faces[i]);
        } catch (_e) {}
      }
    }
    while (priorityDepth !== -1000) {
      try {
        this.render3(priorityFaces[priorityFace++]);
        if (priorityFace === priorityFaceCount && priorityFaces !== Model.tmpPriorityFaces[11]) {
          priorityFace = 0;
          priorityFaces = Model.tmpPriorityFaces[11];
          priorityFaceCount = Model.tmpPriorityFaceCount[11];
          priorityFaceDepths = Model.tmpPriority11FaceDepth;
        }
        if (priorityFace < priorityFaceCount && priorityFaceDepths) {
          priorityDepth = priorityFaceDepths[priorityFace];
        } else {
          priorityDepth = -1000;
        }
      } catch (_e) {}
    }
  }
  render3(face) {
    if (Model.faceNearClipped[face]) {
      this.render3ZClip(face);
      return;
    }
    const a = this.faceVertexA[face];
    const b = this.faceVertexB[face];
    const c = this.faceVertexC[face];
    if (Model.faceClippedX) {
      Pix3D.hclip = Model.faceClippedX[face];
    }
    if (!this.faceAlpha) {
      Pix3D.trans = 0;
    } else {
      Pix3D.trans = this.faceAlpha[face];
    }
    let type;
    if (!this.faceRenderType) {
      type = 0;
    } else {
      type = this.faceRenderType[face] & 3;
    }
    if (type === 0) {
      Pix3D.gouraudTriangle(Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], this.faceColourA[face], this.faceColourB[face], this.faceColourC[face]);
    } else if (type === 1) {
      Pix3D.flatTriangle(Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], Pix3D.colourTable[this.faceColourA[face]]);
    } else if (type === 2) {
      const texturedFace = this.faceRenderType[face] >> 2;
      const tA = this.faceTextureP[texturedFace];
      const tB = this.faceTextureM[texturedFace];
      const tC = this.faceTextureN[texturedFace];
      Pix3D.textureTriangle(Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], this.faceColourA[face], this.faceColourB[face], this.faceColourC[face], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColour[face]);
    } else if (type === 3) {
      const texturedFace = this.faceRenderType[face] >> 2;
      const tA = this.faceTextureP[texturedFace];
      const tB = this.faceTextureM[texturedFace];
      const tC = this.faceTextureN[texturedFace];
      Pix3D.textureTriangle(Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], this.faceColourA[face], this.faceColourA[face], this.faceColourA[face], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColour[face]);
    }
  }
  render3ZClip(face) {
    let elements = 0;
    const centerX = Pix3D.originX;
    const centerY = Pix3D.originY;
    const a = this.faceVertexA[face];
    const b = this.faceVertexB[face];
    const c = this.faceVertexC[face];
    const zA = Model.vertexViewSpaceZ[a];
    const zB = Model.vertexViewSpaceZ[b];
    const zC = Model.vertexViewSpaceZ[c];
    if (zA >= 50) {
      Model.clippedX[elements] = Model.vertexScreenX[a];
      Model.clippedY[elements] = Model.vertexScreenY[a];
      Model.clippedColour[elements++] = this.faceColourA[face];
    } else {
      const xA = Model.vertexViewSpaceX[a];
      const yA = Model.vertexViewSpaceY[a];
      const colourA = this.faceColourA[face];
      if (zC >= 50) {
        const scalar = (50 - zA) * Pix3D.divTable2[zC - zA];
        Model.clippedX[elements] = centerX + ((xA + ((Model.vertexViewSpaceX[c] - xA) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedY[elements] = centerY + ((yA + ((Model.vertexViewSpaceY[c] - yA) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedColour[elements++] = colourA + ((this.faceColourC[face] - colourA) * scalar >> 16);
      }
      if (zB >= 50) {
        const scalar = (50 - zA) * Pix3D.divTable2[zB - zA];
        Model.clippedX[elements] = centerX + ((xA + ((Model.vertexViewSpaceX[b] - xA) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedY[elements] = centerY + ((yA + ((Model.vertexViewSpaceY[b] - yA) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedColour[elements++] = colourA + ((this.faceColourB[face] - colourA) * scalar >> 16);
      }
    }
    if (zB >= 50) {
      Model.clippedX[elements] = Model.vertexScreenX[b];
      Model.clippedY[elements] = Model.vertexScreenY[b];
      Model.clippedColour[elements++] = this.faceColourB[face];
    } else {
      const xB = Model.vertexViewSpaceX[b];
      const yB = Model.vertexViewSpaceY[b];
      const colourB = this.faceColourB[face];
      if (zA >= 50) {
        const scalar = (50 - zB) * Pix3D.divTable2[zA - zB];
        Model.clippedX[elements] = centerX + ((xB + ((Model.vertexViewSpaceX[a] - xB) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedY[elements] = centerY + ((yB + ((Model.vertexViewSpaceY[a] - yB) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedColour[elements++] = colourB + ((this.faceColourA[face] - colourB) * scalar >> 16);
      }
      if (zC >= 50) {
        const scalar = (50 - zB) * Pix3D.divTable2[zC - zB];
        Model.clippedX[elements] = centerX + ((xB + ((Model.vertexViewSpaceX[c] - xB) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedY[elements] = centerY + ((yB + ((Model.vertexViewSpaceY[c] - yB) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedColour[elements++] = colourB + ((this.faceColourC[face] - colourB) * scalar >> 16);
      }
    }
    if (zC >= 50) {
      Model.clippedX[elements] = Model.vertexScreenX[c];
      Model.clippedY[elements] = Model.vertexScreenY[c];
      Model.clippedColour[elements++] = this.faceColourC[face];
    } else {
      const xC = Model.vertexViewSpaceX[c];
      const yC = Model.vertexViewSpaceY[c];
      const colourC = this.faceColourC[face];
      if (zB >= 50) {
        const scalar = (50 - zC) * Pix3D.divTable2[zB - zC];
        Model.clippedX[elements] = centerX + ((xC + ((Model.vertexViewSpaceX[b] - xC) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedY[elements] = centerY + ((yC + ((Model.vertexViewSpaceY[b] - yC) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedColour[elements++] = colourC + ((this.faceColourB[face] - colourC) * scalar >> 16);
      }
      if (zA >= 50) {
        const scalar = (50 - zC) * Pix3D.divTable2[zA - zC];
        Model.clippedX[elements] = centerX + ((xC + ((Model.vertexViewSpaceX[a] - xC) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedY[elements] = centerY + ((yC + ((Model.vertexViewSpaceY[a] - yC) * scalar >> 16) << 9) / 50 | 0);
        Model.clippedColour[elements++] = colourC + ((this.faceColourA[face] - colourC) * scalar >> 16);
      }
    }
    const x0 = Model.clippedX[0];
    const x1 = Model.clippedX[1];
    const x2 = Model.clippedX[2];
    const y0 = Model.clippedY[0];
    const y1 = Model.clippedY[1];
    const y2 = Model.clippedY[2];
    if ((x0 - x1) * (y2 - y1) - (y0 - y1) * (x2 - x1) <= 0) {
      return;
    }
    Pix3D.hclip = false;
    if (elements === 3) {
      if (x0 < 0 || x1 < 0 || x2 < 0 || x0 > Pix2D.sizeX || x1 > Pix2D.sizeX || x2 > Pix2D.sizeX) {
        Pix3D.hclip = true;
      }
      let type;
      if (!this.faceRenderType) {
        type = 0;
      } else {
        type = this.faceRenderType[face] & 3;
      }
      if (type === 0) {
        Pix3D.gouraudTriangle(x0, x1, x2, y0, y1, y2, Model.clippedColour[0], Model.clippedColour[1], Model.clippedColour[2]);
      } else if (type === 1 && this.faceColourA) {
        Pix3D.flatTriangle(x0, x1, x2, y0, y1, y2, Pix3D.colourTable[this.faceColourA[face]]);
      } else if (type === 2) {
        const texturedFace = this.faceRenderType[face] >> 2;
        const tA = this.faceTextureP[texturedFace];
        const tB = this.faceTextureM[texturedFace];
        const tC = this.faceTextureN[texturedFace];
        Pix3D.textureTriangle(x0, x1, x2, y0, y1, y2, Model.clippedColour[0], Model.clippedColour[1], Model.clippedColour[2], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColour[face]);
      } else if (type === 3) {
        const texturedFace = this.faceRenderType[face] >> 2;
        const tA = this.faceTextureP[texturedFace];
        const tB = this.faceTextureM[texturedFace];
        const tC = this.faceTextureN[texturedFace];
        Pix3D.textureTriangle(x0, x1, x2, y0, y1, y2, this.faceColourA[face], this.faceColourA[face], this.faceColourA[face], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColour[face]);
      }
    } else if (elements === 4) {
      if (x0 < 0 || x1 < 0 || x2 < 0 || x0 > Pix2D.sizeX || x1 > Pix2D.sizeX || x2 > Pix2D.sizeX || Model.clippedX[3] < 0 || Model.clippedX[3] > Pix2D.sizeX) {
        Pix3D.hclip = true;
      }
      let type;
      if (!this.faceRenderType) {
        type = 0;
      } else {
        type = this.faceRenderType[face] & 3;
      }
      if (type === 0) {
        Pix3D.gouraudTriangle(x0, x1, x2, y0, y1, y2, Model.clippedColour[0], Model.clippedColour[1], Model.clippedColour[2]);
        Pix3D.gouraudTriangle(x0, x2, Model.clippedX[3], y0, y2, Model.clippedY[3], Model.clippedColour[0], Model.clippedColour[2], Model.clippedColour[3]);
      } else if (type === 1) {
        if (this.faceColourA) {
          const colour = Pix3D.colourTable[this.faceColourA[face]];
          Pix3D.flatTriangle(x0, x1, x2, y0, y1, y2, colour);
          Pix3D.flatTriangle(x0, x2, Model.clippedX[3], y0, y2, Model.clippedY[3], colour);
        }
      } else if (type === 2) {
        const texturedFace = this.faceRenderType[face] >> 2;
        const tA = this.faceTextureP[texturedFace];
        const tB = this.faceTextureM[texturedFace];
        const tC = this.faceTextureN[texturedFace];
        Pix3D.textureTriangle(x0, x1, x2, y0, y1, y2, Model.clippedColour[0], Model.clippedColour[1], Model.clippedColour[2], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColour[face]);
        Pix3D.textureTriangle(x0, x2, Model.clippedX[3], y0, y2, Model.clippedY[3], Model.clippedColour[0], Model.clippedColour[2], Model.clippedColour[3], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColour[face]);
      } else if (type === 3) {
        const texturedFace = this.faceRenderType[face] >> 2;
        const tA = this.faceTextureP[texturedFace];
        const tB = this.faceTextureM[texturedFace];
        const tC = this.faceTextureN[texturedFace];
        Pix3D.textureTriangle(x0, x1, x2, y0, y1, y2, this.faceColourA[face], this.faceColourA[face], this.faceColourA[face], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColour[face]);
        Pix3D.textureTriangle(x0, x2, Model.clippedX[3], y0, y2, Model.clippedY[3], this.faceColourA[face], this.faceColourA[face], this.faceColourA[face], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColour[face]);
      }
    }
  }
  isMouseRoughlyInsideTriangle(x, y, yA, yB, yC, xA, xB, xC) {
    if (y < yA && y < yB && y < yC) {
      return false;
    } else if (y > yA && y > yB && y > yC) {
      return false;
    } else if (x < xA && x < xB && x < xC) {
      return false;
    } else if (x > xA && x > xB && x > xC) {
      return false;
    } else {
      return true;
    }
  }
}

// src/config/LocType.ts
class LocType {
  static numDefinitions = 0;
  static idx = null;
  static dat = null;
  static recent = null;
  static recentPos = 0;
  static mc1 = new LruCache(500);
  static mc2 = new LruCache(30);
  id = -1;
  model = null;
  shape = null;
  name = null;
  desc = null;
  recol_s = null;
  recol_d = null;
  width = 1;
  length = 1;
  blockwalk = true;
  blockrange = true;
  active = false;
  hillskew = false;
  sharelight = false;
  occlude = false;
  anim = -1;
  animateTransparencies = false;
  wallwidth = 16;
  ambient = 0;
  contrast = 0;
  op = null;
  mapfunction = -1;
  mapscene = -1;
  mirror = false;
  shadow = true;
  resizex = 128;
  resizey = 128;
  resizez = 128;
  offsetx = 0;
  offsety = 0;
  offsetz = 0;
  forceapproach = 0;
  forcedecor = false;
  static init(config) {
    this.dat = new Packet(config.read("loc.dat"));
    const idx = new Packet(config.read("loc.idx"));
    this.numDefinitions = idx.g2();
    this.idx = new Int32Array(this.numDefinitions);
    let offset = 2;
    for (let id = 0;id < this.numDefinitions; id++) {
      this.idx[id] = offset;
      offset += idx.g2();
    }
    this.recent = new TypedArray1d(10, null);
    for (let id = 0;id < 10; id++) {
      this.recent[id] = new LocType;
    }
  }
  static list(id) {
    if (!this.recent || !this.idx || !this.dat) {
      throw new Error;
    }
    for (let i = 0;i < 10; i++) {
      const type = this.recent[i];
      if (type && type.id === id) {
        return type;
      }
    }
    this.recentPos = (this.recentPos + 1) % 10;
    const loc = this.recent[this.recentPos];
    this.dat.pos = this.idx[id];
    loc.id = id;
    loc.reset();
    loc.decode(this.dat);
    return loc;
  }
  reset() {
    this.model = null;
    this.shape = null;
    this.name = null;
    this.desc = null;
    this.recol_s = null;
    this.recol_d = null;
    this.width = 1;
    this.length = 1;
    this.blockwalk = true;
    this.blockrange = true;
    this.active = false;
    this.hillskew = false;
    this.sharelight = false;
    this.occlude = false;
    this.anim = -1;
    this.wallwidth = 16;
    this.ambient = 0;
    this.contrast = 0;
    this.op = null;
    this.animateTransparencies = false;
    this.mapfunction = -1;
    this.mapscene = -1;
    this.mirror = false;
    this.shadow = true;
    this.resizex = 128;
    this.resizey = 128;
    this.resizez = 128;
    this.forceapproach = 0;
    this.offsetx = 0;
    this.offsety = 0;
    this.offsetz = 0;
    this.forcedecor = false;
  }
  decode(dat) {
    let active = -1;
    while (true) {
      const code = dat.g1();
      if (code === 0) {
        break;
      }
      if (code === 1) {
        const count = dat.g1();
        this.model = new Int32Array(count);
        this.shape = new Int32Array(count);
        for (let i = 0;i < count; i++) {
          this.model[i] = dat.g2();
          this.shape[i] = dat.g1();
        }
      } else if (code === 2) {
        this.name = dat.gjstr();
      } else if (code === 3) {
        this.desc = dat.gjstr();
      } else if (code === 14) {
        this.width = dat.g1();
      } else if (code === 15) {
        this.length = dat.g1();
      } else if (code === 17) {
        this.blockwalk = false;
      } else if (code === 18) {
        this.blockrange = false;
      } else if (code === 19) {
        active = dat.g1();
        if (active === 1) {
          this.active = true;
        }
      } else if (code === 21) {
        this.hillskew = true;
      } else if (code === 22) {
        this.sharelight = true;
      } else if (code === 23) {
        this.occlude = true;
      } else if (code === 24) {
        this.anim = dat.g2();
        if (this.anim === 65535) {
          this.anim = -1;
        }
      } else if (code === 25) {
        this.animateTransparencies = true;
      } else if (code === 28) {
        this.wallwidth = dat.g1();
      } else if (code === 29) {
        this.ambient = dat.g1b();
      } else if (code === 39) {
        this.contrast = dat.g1b();
      } else if (code >= 30 && code < 39) {
        if (!this.op) {
          this.op = new TypedArray1d(5, null);
        }
        this.op[code - 30] = dat.gjstr();
        if (this.op[code - 30]?.toLowerCase() === "hidden") {
          this.op[code - 30] = null;
        }
      } else if (code === 40) {
        const count = dat.g1();
        this.recol_s = new Uint16Array(count);
        this.recol_d = new Uint16Array(count);
        for (let i = 0;i < count; i++) {
          this.recol_s[i] = dat.g2();
          this.recol_d[i] = dat.g2();
        }
      } else if (code === 60) {
        this.mapfunction = dat.g2();
      } else if (code === 62) {
        this.mirror = true;
      } else if (code === 64) {
        this.shadow = false;
      } else if (code === 65) {
        this.resizex = dat.g2();
      } else if (code === 66) {
        this.resizey = dat.g2();
      } else if (code === 67) {
        this.resizez = dat.g2();
      } else if (code === 68) {
        this.mapscene = dat.g2();
      } else if (code === 69) {
        this.forceapproach = dat.g1();
      } else if (code === 70) {
        this.offsetx = dat.g2b();
      } else if (code === 71) {
        this.offsety = dat.g2b();
      } else if (code === 72) {
        this.offsetz = dat.g2b();
      } else if (code === 73) {
        this.forcedecor = true;
      }
    }
    if (!this.shape) {
      this.shape = new Int32Array(1);
    }
    if (active === -1) {
      this.active = false;
      if (this.shape.length > 0 && this.shape[0] === 10 /* CENTREPIECE_STRAIGHT */) {
        this.active = true;
      }
      if (this.op) {
        this.active = true;
      }
    }
  }
  getModel(shape, angle, heightmapSW, heightmapSE, heightmapNE, heightmapNW, transformId) {
    if (!this.shape) {
      return null;
    }
    let index = -1;
    for (let i = 0;i < this.shape.length; i++) {
      if (this.shape[i] === shape) {
        index = i;
        break;
      }
    }
    if (index === -1) {
      return null;
    }
    const typecode = (BigInt(transformId) + 1n << 32n) + (BigInt(this.id) << 6n) + (BigInt(index) << 3n) + BigInt(angle);
    let cached = LocType.mc2.find(typecode);
    if (cached) {
      if (this.hillskew || this.sharelight) {
        cached = Model.hillSkewCopy(cached, this.hillskew, this.sharelight);
      }
      if (this.hillskew) {
        const groundY = (heightmapSW + heightmapSE + heightmapNE + heightmapNW) / 4 | 0;
        for (let i = 0;i < cached.numPoints; i++) {
          const x = cached.pointX[i];
          const z = cached.pointZ[i];
          const heightS = heightmapSW + ((heightmapSE - heightmapSW) * (x + 64) / 128 | 0);
          const heightN = heightmapNW + ((heightmapNE - heightmapNW) * (x + 64) / 128 | 0);
          const y = heightS + ((heightN - heightS) * (z + 64) / 128 | 0);
          cached.pointY[i] += y - groundY;
        }
        cached.recalcBoundingCylinder();
      }
      return cached;
    }
    if (!this.model) {
      return null;
    }
    if (index >= this.model.length) {
      return null;
    }
    let modelId = this.model[index];
    if (modelId === -1) {
      return null;
    }
    const flip = this.mirror !== angle > 3;
    if (flip) {
      modelId += 65536;
    }
    let model = LocType.mc1.find(BigInt(modelId));
    if (!model) {
      model = Model.load(modelId & 65535);
      if (flip) {
        model.mirror();
      }
      LocType.mc1?.put(BigInt(modelId), model);
    }
    const scaled = this.resizex !== 128 || this.resizey !== 128 || this.resizez !== 128;
    const translated = this.offsetx !== 0 || this.offsety !== 0 || this.offsetz !== 0;
    let modified = Model.copyForAnim(model, !this.recol_s, !this.animateTransparencies, angle === 0 /* WEST */ && transformId === -1 && !scaled && !translated);
    if (transformId !== -1) {
      modified.prepareAnim();
      modified.animate(transformId);
      modified.labelFaces = null;
      modified.labelVertices = null;
    }
    while (angle-- > 0) {
      modified.rotate90();
    }
    if (this.recol_s && this.recol_d) {
      for (let i = 0;i < this.recol_s.length; i++) {
        modified.recolour(this.recol_s[i], this.recol_d[i]);
      }
    }
    if (scaled) {
      modified.resize(this.resizex, this.resizey, this.resizez);
    }
    if (translated) {
      modified.translate(this.offsety, this.offsetx, this.offsetz);
    }
    modified.calculateNormals((this.ambient & 255) + 64, (this.contrast & 255) * 5 + 768, -50, -10, -50, !this.sharelight);
    if (this.blockwalk) {
      modified.objRaise = modified.minY;
    }
    LocType.mc2.put(typecode, modified);
    if (this.hillskew || this.sharelight) {
      modified = Model.hillSkewCopy(modified, this.hillskew, this.sharelight);
    }
    if (this.hillskew) {
      const groundY = (heightmapSW + heightmapSE + heightmapNE + heightmapNW) / 4 | 0;
      for (let i = 0;i < modified.numPoints; i++) {
        const x = modified.pointX[i];
        const z = modified.pointZ[i];
        const heightS = heightmapSW + ((heightmapSE - heightmapSW) * (x + 64) / 128 | 0);
        const heightN = heightmapNW + ((heightmapNE - heightmapNW) * (x + 64) / 128 | 0);
        const y = heightS + ((heightN - heightS) * (z + 64) / 128 | 0);
        modified.pointY[i] += y - groundY;
      }
      modified.recalcBoundingCylinder();
    }
    return modified;
  }
}

// src/graphics/Jpeg.ts
var jpegCanvas = document.createElement("canvas");
var jpegImg = document.createElement("img");
var jpeg2d = jpegCanvas.getContext("2d", {
  willReadFrequently: true
});
async function decodeJpeg(data) {
  if (data[0] !== 255) {
    data[0] = 255;
  }
  URL.revokeObjectURL(jpegImg.src);
  jpegImg.src = URL.createObjectURL(new Blob([data], { type: "image/jpeg" }));
  await new Promise((resolve) => jpegImg.onload = () => resolve());
  jpeg2d.clearRect(0, 0, jpegCanvas.width, jpegCanvas.height);
  const width = jpegImg.naturalWidth;
  const height = jpegImg.naturalHeight;
  jpegCanvas.width = width;
  jpegCanvas.height = height;
  jpeg2d.drawImage(jpegImg, 0, 0);
  return jpeg2d.getImageData(0, 0, width, height);
}

// src/graphics/Pix32.ts
class Pix32 extends Pix2D {
  data;
  wi;
  hi;
  xof;
  yof;
  owi;
  ohi;
  constructor(width, height) {
    super();
    this.data = new Int32Array(width * height);
    this.wi = this.owi = width;
    this.hi = this.ohi = height;
    this.xof = this.yof = 0;
  }
  static async fromJpeg(archive, name) {
    const dat = archive.read(name);
    if (!dat) {
      throw new Error;
    }
    const jpeg = await decodeJpeg(dat);
    const image = new Pix32(jpeg.width, jpeg.height);
    const data = new Uint32Array(jpeg.data.buffer);
    for (let i = 0;i < image.data.length; i++) {
      const pixel = data[i];
      image.data[i] = (pixel >> 24 & 255) << 24 | (pixel & 255) << 16 | (pixel >> 8 & 255) << 8 | pixel >> 16 & 255;
    }
    return image;
  }
  static depack(jag, name, sprite = 0) {
    const dat = new Packet(jag.read(name + ".dat"));
    const index = new Packet(jag.read("index.dat"));
    index.pos = dat.g2();
    const owi = index.g2();
    const ohi = index.g2();
    const bpalCount = index.g1();
    const bpal = new Int32Array(bpalCount);
    for (let i = 0;i < bpalCount - 1; i++) {
      bpal[i + 1] = index.g3();
      if (bpal[i + 1] === 0) {
        bpal[i + 1] = 1;
      }
    }
    for (let i = 0;i < sprite; i++) {
      index.pos += 2;
      dat.pos += index.g2() * index.g2();
      index.pos += 1;
    }
    if (dat.pos > dat.length || index.pos > index.length) {
      throw new Error;
    }
    const xof = index.g1();
    const yof = index.g1();
    const wi = index.g2();
    const hi = index.g2();
    const image = new Pix32(wi, hi);
    image.xof = xof;
    image.yof = yof;
    image.owi = owi;
    image.ohi = ohi;
    const encoding = index.g1();
    if (encoding === 0) {
      for (let i = 0;i < image.wi * image.hi; i++) {
        image.data[i] = bpal[dat.g1()];
      }
    } else if (encoding === 1) {
      for (let x = 0;x < image.wi; x++) {
        for (let y = 0;y < image.hi; y++) {
          image.data[x + y * image.wi] = bpal[dat.g1()];
        }
      }
    }
    return image;
  }
  setPixels() {
    Pix2D.setPixels(this.data, this.wi, this.hi);
  }
  rgbAdjust(r, g, b) {
    for (let i = 0;i < this.data.length; i++) {
      const rgb = this.data[i];
      if (rgb !== 0) {
        let red = rgb >> 16 & 255;
        red += r;
        if (red < 1) {
          red = 1;
        } else if (red > 255) {
          red = 255;
        }
        let green = rgb >> 8 & 255;
        green += g;
        if (green < 1) {
          green = 1;
        } else if (green > 255) {
          green = 255;
        }
        let blue = rgb & 255;
        blue += b;
        if (blue < 1) {
          blue = 1;
        } else if (blue > 255) {
          blue = 255;
        }
        this.data[i] = (red << 16) + (green << 8) + blue;
      }
    }
  }
  hflip() {
    const pixels = this.data;
    const width = this.wi;
    const height = this.hi;
    for (let y = 0;y < height; y++) {
      const div = width / 2 | 0;
      for (let x = 0;x < div; x++) {
        const off1 = x + y * width;
        const off2 = width - x - 1 + y * width;
        const tmp = pixels[off1];
        pixels[off1] = pixels[off2];
        pixels[off2] = tmp;
      }
    }
  }
  vflip() {
    const pixels = this.data;
    const width = this.wi;
    const height = this.hi;
    for (let y = 0;y < (height / 2 | 0); y++) {
      for (let x = 0;x < width; x++) {
        const off1 = x + y * width;
        const off2 = x + (height - y - 1) * width;
        const tmp = pixels[off1];
        pixels[off1] = pixels[off2];
        pixels[off2] = tmp;
      }
    }
  }
  quickPlotSprite(x, y) {
    x |= 0;
    y |= 0;
    x += this.xof;
    y += this.yof;
    let dstOff = x + y * Pix2D.width;
    let srcOff = 0;
    let h = this.hi;
    let w = this.wi;
    let dstStep = Pix2D.width - w;
    let srcStep = 0;
    if (y < Pix2D.clipMinY) {
      const cutoff = Pix2D.clipMinY - y;
      h -= cutoff;
      y = Pix2D.clipMinY;
      srcOff += cutoff * w;
      dstOff += cutoff * Pix2D.width;
    }
    if (y + h > Pix2D.clipMaxY) {
      h -= y + h - Pix2D.clipMaxY;
    }
    if (x < Pix2D.clipMinX) {
      const cutoff = Pix2D.clipMinX - x;
      w -= cutoff;
      x = Pix2D.clipMinX;
      srcOff += cutoff;
      dstOff += cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }
    if (x + w > Pix2D.clipMaxX) {
      const cutoff = x + w - Pix2D.clipMaxX;
      w -= cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }
    if (w > 0 && h > 0) {
      this.plotQuick(w, h, this.data, srcOff, srcStep, Pix2D.pixels, dstOff, dstStep);
    }
  }
  plotQuick(w, h, src, srcOff, srcStep, dst, dstOff, dstStep) {
    const qw = -(w >> 2);
    w = -(w & 3);
    for (let y = -h;y < 0; y++) {
      for (let x = qw;x < 0; x++) {
        dst[dstOff++] = src[srcOff++];
        dst[dstOff++] = src[srcOff++];
        dst[dstOff++] = src[srcOff++];
        dst[dstOff++] = src[srcOff++];
      }
      for (let x = w;x < 0; x++) {
        dst[dstOff++] = src[srcOff++];
      }
      dstOff += dstStep;
      srcOff += srcStep;
    }
  }
  plotSprite(x, y) {
    x |= 0;
    y |= 0;
    x += this.xof;
    y += this.yof;
    let dstOff = x + y * Pix2D.width;
    let srcOff = 0;
    let h = this.hi;
    let w = this.wi;
    let dstStep = Pix2D.width - w;
    let srcStep = 0;
    if (y < Pix2D.clipMinY) {
      const cutoff = Pix2D.clipMinY - y;
      h -= cutoff;
      y = Pix2D.clipMinY;
      srcOff += cutoff * w;
      dstOff += cutoff * Pix2D.width;
    }
    if (y + h > Pix2D.clipMaxY) {
      h -= y + h - Pix2D.clipMaxY;
    }
    if (x < Pix2D.clipMinX) {
      const cutoff = Pix2D.clipMinX - x;
      w -= cutoff;
      x = Pix2D.clipMinX;
      srcOff += cutoff;
      dstOff += cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }
    if (x + w > Pix2D.clipMaxX) {
      const cutoff = x + w - Pix2D.clipMaxX;
      w -= cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }
    if (w > 0 && h > 0) {
      this.plot(w, h, this.data, srcOff, srcStep, Pix2D.pixels, dstOff, dstStep);
    }
  }
  plot(w, h, src, srcOff, srcStep, dst, dstOff, dstStep) {
    const qw = -(w >> 2);
    w = -(w & 3);
    for (let y = -h;y < 0; y++) {
      for (let x = qw;x < 0; x++) {
        let rgb = src[srcOff++];
        if (rgb === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
        rgb = src[srcOff++];
        if (rgb === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
        rgb = src[srcOff++];
        if (rgb === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
        rgb = src[srcOff++];
        if (rgb === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
      }
      for (let x = w;x < 0; x++) {
        const rgb = src[srcOff++];
        if (rgb === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
      }
      dstOff += dstStep;
      srcOff += srcStep;
    }
  }
  transPlotSprite(alpha, x, y) {
    x |= 0;
    y |= 0;
    x += this.xof;
    y += this.yof;
    let dstStep = x + y * Pix2D.width;
    let srcStep = 0;
    let h = this.hi;
    let w = this.wi;
    let dstOff = Pix2D.width - w;
    let srcOff = 0;
    if (y < Pix2D.clipMinY) {
      const cutoff = Pix2D.clipMinY - y;
      h -= cutoff;
      y = Pix2D.clipMinY;
      srcStep += cutoff * w;
      dstStep += cutoff * Pix2D.width;
    }
    if (y + h > Pix2D.clipMaxY) {
      h -= y + h - Pix2D.clipMaxY;
    }
    if (x < Pix2D.clipMinX) {
      const cutoff = Pix2D.clipMinX - x;
      w -= cutoff;
      x = Pix2D.clipMinX;
      srcStep += cutoff;
      dstStep += cutoff;
      srcOff += cutoff;
      dstOff += cutoff;
    }
    if (x + w > Pix2D.clipMaxX) {
      const cutoff = x + w - Pix2D.clipMaxX;
      w -= cutoff;
      srcOff += cutoff;
      dstOff += cutoff;
    }
    if (w > 0 && h > 0) {
      this.tranSprite(w, h, this.data, srcStep, srcOff, Pix2D.pixels, dstStep, dstOff, alpha);
    }
  }
  tranSprite(w, h, src, srcOff, srcStep, dst, dstOff, dstStep, alpha) {
    const invAlpha = 256 - alpha;
    for (let y = -h;y < 0; y++) {
      for (let x = -w;x < 0; x++) {
        const rgb = src[srcOff++];
        if (rgb === 0) {
          dstOff++;
        } else {
          const dstRgb = dst[dstOff];
          dst[dstOff++] = ((rgb & 16711935) * alpha + (dstRgb & 16711935) * invAlpha & 4278255360) + ((rgb & 65280) * alpha + (dstRgb & 65280) * invAlpha & 16711680) >> 8;
        }
      }
      dstOff += dstStep;
      srcOff += srcStep;
    }
  }
  scanlineRotatePlotSprite(x, y, w, h, lineStart, lineWidth, anchorX, anchorY, theta, zoom) {
    x |= 0;
    y |= 0;
    w |= 0;
    h |= 0;
    try {
      const centerX = -w / 2 | 0;
      const centerY = -h / 2 | 0;
      const sin = Math.sin(theta / 326.11) * 65536 | 0;
      const cos = Math.cos(theta / 326.11) * 65536 | 0;
      const sinZoom = sin * zoom >> 8;
      const cosZoom = cos * zoom >> 8;
      let leftX = (anchorX << 16) + centerY * sinZoom + centerX * cosZoom;
      let leftY = (anchorY << 16) + (centerY * cosZoom - centerX * sinZoom);
      let leftOff = x + y * Pix2D.width;
      for (let i = 0;i < h; i++) {
        const dstOff = lineStart[i];
        let dstX = leftOff + dstOff;
        let srcX = leftX + cosZoom * dstOff;
        let srcY = leftY - sinZoom * dstOff;
        for (let j = -lineWidth[i];j < 0; j++) {
          Pix2D.pixels[dstX++] = this.data[(srcX >> 16) + (srcY >> 16) * this.wi];
          srcX += cosZoom;
          srcY -= sinZoom;
        }
        leftX += sinZoom;
        leftY += cosZoom;
        leftOff += Pix2D.width;
      }
    } catch (_e) {}
  }
  scanlinePlotSprite(x, y, mask) {
    x |= 0;
    y |= 0;
    x += this.xof;
    y += this.yof;
    let dstStep = x + y * Pix2D.width;
    let srcStep = 0;
    let h = this.hi;
    let w = this.wi;
    let dstOff = Pix2D.width - w;
    let srcOff = 0;
    if (y < Pix2D.clipMinY) {
      const cutoff = Pix2D.clipMinY - y;
      h -= cutoff;
      y = Pix2D.clipMinY;
      srcStep += cutoff * w;
      dstStep += cutoff * Pix2D.width;
    }
    if (y + h > Pix2D.clipMaxY) {
      h -= y + h - Pix2D.clipMaxY;
    }
    if (x < Pix2D.clipMinX) {
      const cutoff = Pix2D.clipMinX - x;
      w -= cutoff;
      x = Pix2D.clipMinX;
      srcStep += cutoff;
      dstStep += cutoff;
      srcOff += cutoff;
      dstOff += cutoff;
    }
    if (x + w > Pix2D.clipMaxX) {
      const cutoff = x + w - Pix2D.clipMaxX;
      w -= cutoff;
      srcOff += cutoff;
      dstOff += cutoff;
    }
    if (w > 0 && h > 0) {
      this.plotScanline(w, h, this.data, srcOff, srcStep, Pix2D.pixels, dstStep, dstOff, mask.data);
    }
  }
  plotScanline(w, h, src, srcStep, srcOff, dst, dstOff, dstStep, mask) {
    const qw = -(w >> 2);
    w = -(w & 3);
    for (let y = -h;y < 0; y++) {
      for (let x = qw;x < 0; x++) {
        let rgb = src[srcOff++];
        if (rgb !== 0 && mask[dstOff] === 0) {
          dst[dstOff++] = rgb;
        } else {
          dstOff++;
        }
        rgb = src[srcOff++];
        if (rgb !== 0 && mask[dstOff] === 0) {
          dst[dstOff++] = rgb;
        } else {
          dstOff++;
        }
        rgb = src[srcOff++];
        if (rgb !== 0 && mask[dstOff] === 0) {
          dst[dstOff++] = rgb;
        } else {
          dstOff++;
        }
        rgb = src[srcOff++];
        if (rgb !== 0 && mask[dstOff] === 0) {
          dst[dstOff++] = rgb;
        } else {
          dstOff++;
        }
      }
      for (let x = w;x < 0; x++) {
        const rgb = src[srcOff++];
        if (rgb !== 0 && mask[dstOff] === 0) {
          dst[dstOff++] = rgb;
        } else {
          dstOff++;
        }
      }
      dstOff += dstStep;
      srcOff += srcStep;
    }
  }
  scalePlotSprite(x, y, w, h) {
    x |= 0;
    y |= 0;
    w |= 0;
    h |= 0;
    try {
      const currentW = this.wi;
      let offW = 0;
      let offH = 0;
      const cw = this.owi;
      const ch = this.ohi;
      const scaleCropWidth = (cw << 16) / w | 0;
      const scaleCropHeight = (ch << 16) / h | 0;
      x += (this.xof * w + cw - 1) / cw | 0;
      y += (this.yof * h + ch - 1) / ch | 0;
      if (this.xof * w % cw !== 0) {
        offW = (cw - this.xof * w % cw << 16) / w | 0;
      }
      if (this.yof * h % ch !== 0) {
        offH = (ch - this.yof * h % ch << 16) / h | 0;
      }
      w = w * (this.wi - (offW >> 16)) / cw | 0;
      h = h * (this.hi - (offH >> 16)) / ch | 0;
      let dstStep = x + y * Pix2D.width;
      let dstOff = Pix2D.width - w;
      if (y < Pix2D.clipMinY) {
        const cutoff = Pix2D.clipMinY - y;
        h -= cutoff;
        y = 0;
        dstStep += cutoff * Pix2D.width;
        offH += scaleCropHeight * cutoff;
      }
      if (y + h > Pix2D.clipMaxY) {
        h -= y + h - Pix2D.clipMaxY;
      }
      if (x < Pix2D.clipMinX) {
        const cutoff = Pix2D.clipMinX - x;
        w -= cutoff;
        x = 0;
        dstStep += cutoff;
        offW += scaleCropWidth * cutoff;
        dstOff += cutoff;
      }
      if (x + w > Pix2D.clipMaxX) {
        const cutoff = x + w - Pix2D.clipMaxX;
        w -= cutoff;
        dstOff += cutoff;
      }
      this.plotScale(w, h, this.data, offW, offH, Pix2D.pixels, dstOff, dstStep, currentW, scaleCropWidth, scaleCropHeight);
    } catch (e) {
      console.error("error in sprite clipping routine");
    }
  }
  plotScale(w, h, src, offW, offH, dst, dstStep, dstOff, currentW, scaleCropWidth, scaleCropHeight) {
    try {
      const lastOffW = offW;
      for (let y = -h;y < 0; y++) {
        const offY = (offH >> 16) * currentW;
        for (let x = -w;x < 0; x++) {
          const rgb = src[(offW >> 16) + offY];
          if (rgb === 0) {
            dstOff++;
          } else {
            dst[dstOff++] = rgb;
          }
          offW += scaleCropWidth;
        }
        offH += scaleCropHeight;
        offW = lastOffW;
        dstOff += dstStep;
      }
    } catch (e) {
      console.error("error in plot_scale");
    }
  }
}

// src/config/ObjType.ts
class ObjType {
  static numDefinitions = 0;
  static idx = null;
  static dat = null;
  static recent = null;
  static recentPos = 0;
  static memServer = true;
  static modelCache = new LruCache(50);
  static spriteCache = new LruCache(200);
  id = -1;
  model = 0;
  name = null;
  desc = null;
  recol_s = null;
  recol_d = null;
  zoom2d = 2000;
  xan2d = 0;
  yan2d = 0;
  zan2d = 0;
  xof2d = 0;
  yof2d = 0;
  stackable = false;
  cost = 1;
  members = false;
  op = null;
  iop = null;
  manwear = -1;
  manwear2 = -1;
  manwearOffset = 0;
  womanwear = -1;
  womanwear2 = -1;
  womanwearOffset = 0;
  manwear3 = -1;
  womanwear3 = -1;
  manhead = -1;
  manhead2 = -1;
  womanhead = -1;
  womanhead2 = -1;
  countobj = null;
  countco = null;
  certlink = -1;
  certtemplate = -1;
  static init(config, members) {
    this.memServer = members;
    this.dat = new Packet(config.read("obj.dat"));
    const idx = new Packet(config.read("obj.idx"));
    this.numDefinitions = idx.g2();
    this.idx = new Int32Array(this.numDefinitions);
    let offset = 2;
    for (let id = 0;id < this.numDefinitions; id++) {
      this.idx[id] = offset;
      offset += idx.g2();
    }
    this.recent = new TypedArray1d(10, null);
    for (let id = 0;id < 10; id++) {
      this.recent[id] = new ObjType;
    }
  }
  static list(id) {
    if (!this.recent || !this.idx || !this.dat) {
      throw new Error;
    }
    for (let i = 0;i < 10; i++) {
      const type = this.recent[i];
      if (type && type.id === id) {
        return type;
      }
    }
    this.recentPos = (this.recentPos + 1) % 10;
    const obj = this.recent[this.recentPos];
    this.dat.pos = this.idx[id];
    obj.id = id;
    obj.reset();
    obj.decode(this.dat);
    if (obj.certtemplate !== -1) {
      obj.genCert();
    }
    if (!this.memServer && obj.members) {
      obj.name = "Members Object";
      obj.desc = "Login to a members' server to use this object.";
      obj.op = null;
      obj.iop = null;
    }
    return obj;
  }
  reset() {
    this.model = 0;
    this.name = null;
    this.desc = null;
    this.recol_s = null;
    this.recol_d = null;
    this.zoom2d = 2000;
    this.xan2d = 0;
    this.yan2d = 0;
    this.zan2d = 0;
    this.xof2d = 0;
    this.yof2d = 0;
    this.stackable = false;
    this.cost = 1;
    this.members = false;
    this.op = null;
    this.iop = null;
    this.manwear = -1;
    this.manwear2 = -1;
    this.manwearOffset = 0;
    this.womanwear = -1;
    this.womanwear2 = -1;
    this.womanwearOffset = 0;
    this.manwear3 = -1;
    this.womanwear3 = -1;
    this.manhead = -1;
    this.manhead2 = -1;
    this.womanhead = -1;
    this.womanhead2 = -1;
    this.countobj = null;
    this.countco = null;
    this.certlink = -1;
    this.certtemplate = -1;
  }
  decode(dat) {
    while (true) {
      const code = dat.g1();
      if (code === 0) {
        break;
      }
      if (code === 1) {
        this.model = dat.g2();
      } else if (code === 2) {
        this.name = dat.gjstr();
      } else if (code === 3) {
        this.desc = dat.gjstr();
      } else if (code === 4) {
        this.zoom2d = dat.g2();
      } else if (code === 5) {
        this.xan2d = dat.g2();
      } else if (code === 6) {
        this.yan2d = dat.g2();
      } else if (code === 7) {
        this.xof2d = dat.g2b();
        if (this.xof2d > 32767) {
          this.xof2d -= 65536;
        }
      } else if (code === 8) {
        this.yof2d = dat.g2b();
        if (this.yof2d > 32767) {
          this.yof2d -= 65536;
        }
      } else if (code === 9) {} else if (code === 10) {
        dat.pos += 2;
      } else if (code === 11) {
        this.stackable = true;
      } else if (code === 12) {
        this.cost = dat.g4();
      } else if (code === 16) {
        this.members = true;
      } else if (code === 23) {
        this.manwear = dat.g2();
        this.manwearOffset = dat.g1b();
      } else if (code === 24) {
        this.manwear2 = dat.g2();
      } else if (code === 25) {
        this.womanwear = dat.g2();
        this.womanwearOffset = dat.g1b();
      } else if (code === 26) {
        this.womanwear2 = dat.g2();
      } else if (code >= 30 && code < 35) {
        if (!this.op) {
          this.op = new TypedArray1d(5, null);
        }
        this.op[code - 30] = dat.gjstr();
        if (this.op[code - 30]?.toLowerCase() === "hidden") {
          this.op[code - 30] = null;
        }
      } else if (code >= 35 && code < 40) {
        if (!this.iop) {
          this.iop = new TypedArray1d(5, null);
        }
        this.iop[code - 35] = dat.gjstr();
      } else if (code === 40) {
        const count = dat.g1();
        this.recol_s = new Uint16Array(count);
        this.recol_d = new Uint16Array(count);
        for (let i = 0;i < count; i++) {
          this.recol_s[i] = dat.g2();
          this.recol_d[i] = dat.g2();
        }
      } else if (code === 78) {
        this.manwear3 = dat.g2();
      } else if (code === 79) {
        this.womanwear3 = dat.g2();
      } else if (code === 90) {
        this.manhead = dat.g2();
      } else if (code === 91) {
        this.womanhead = dat.g2();
      } else if (code === 92) {
        this.manhead2 = dat.g2();
      } else if (code === 93) {
        this.womanhead2 = dat.g2();
      } else if (code === 95) {
        this.zan2d = dat.g2();
      } else if (code === 97) {
        this.certlink = dat.g2();
      } else if (code === 98) {
        this.certtemplate = dat.g2();
      } else if (code >= 100 && code < 110) {
        if (!this.countobj || !this.countco) {
          this.countobj = new Uint16Array(10);
          this.countco = new Uint16Array(10);
        }
        this.countobj[code - 100] = dat.g2();
        this.countco[code - 100] = dat.g2();
      }
    }
  }
  genCert() {
    const template = ObjType.list(this.certtemplate);
    this.model = template.model;
    this.zoom2d = template.zoom2d;
    this.xan2d = template.xan2d;
    this.yan2d = template.yan2d;
    this.zan2d = template.zan2d;
    this.xof2d = template.xof2d;
    this.yof2d = template.yof2d;
    this.recol_s = template.recol_s;
    this.recol_d = template.recol_d;
    const link = ObjType.list(this.certlink);
    this.name = link.name;
    this.members = link.members;
    this.cost = link.cost;
    let article = "a";
    const c = (link.name || "").toLowerCase().charAt(0);
    if (c === "a" || c === "e" || c === "i" || c === "o" || c === "u") {
      article = "an";
    }
    this.desc = `Swap this note at any bank for ${article} ${link.name}.`;
    this.stackable = true;
  }
  getModelLit(count) {
    if (this.countobj && this.countco && count > 1) {
      let id = -1;
      for (let i = 0;i < 10; i++) {
        if (count >= this.countco[i] && this.countco[i] !== 0) {
          id = this.countobj[i];
        }
      }
      if (id !== -1) {
        return ObjType.list(id).getModelLit(1);
      }
    }
    let model = ObjType.modelCache.find(BigInt(this.id));
    if (model) {
      return model;
    }
    model = Model.load(this.model);
    if (this.recol_s && this.recol_d) {
      for (let i = 0;i < this.recol_s.length; i++) {
        model.recolour(this.recol_s[i], this.recol_d[i]);
      }
    }
    model.calculateNormals(64, 768, -50, -10, -50, true);
    model.useAABBMouseCheck = true;
    ObjType.modelCache.put(BigInt(this.id), model);
    return model;
  }
  static getSprite(id, count) {
    {
      let icon2 = ObjType.spriteCache.find(BigInt(id));
      if (icon2 && icon2.ohi !== count && icon2.ohi !== -1) {
        icon2.unlink();
        icon2 = null;
      }
      if (icon2) {
        return icon2;
      }
    }
    let obj = ObjType.list(id);
    if (!obj.countobj) {
      count = -1;
    }
    if (obj.countobj && obj.countco && count > 1) {
      let countobj = -1;
      for (let i = 0;i < 10; i++) {
        if (count >= obj.countco[i] && obj.countco[i] !== 0) {
          countobj = obj.countobj[i];
        }
      }
      if (countobj !== -1) {
        obj = ObjType.list(countobj);
      }
    }
    const icon = new Pix32(32, 32);
    const _cx = Pix3D.originX;
    const _cy = Pix3D.originY;
    const _loff = Pix3D.scanline;
    const _data = Pix2D.pixels;
    const _w = Pix2D.width;
    const _h = Pix2D.height;
    const _l = Pix2D.clipMinX;
    const _r = Pix2D.clipMaxX;
    const _t = Pix2D.clipMinY;
    const _b = Pix2D.clipMaxY;
    Pix3D.lowDetail = false;
    Pix2D.setPixels(icon.data, 32, 32);
    Pix2D.fillRect(0, 0, 32, 32, 0 /* BLACK */);
    Pix3D.setRenderClipping();
    const model = obj.getModelLit(1);
    const sinPitch = Pix3D.sinTable[obj.xan2d] * obj.zoom2d >> 16;
    const cosPitch = Pix3D.cosTable[obj.xan2d] * obj.zoom2d >> 16;
    model.objRender(0, obj.yan2d, obj.zan2d, obj.xan2d, obj.xof2d, sinPitch + (model.minY / 2 | 0) + obj.yof2d, cosPitch + obj.yof2d);
    for (let x = 31;x >= 0; x--) {
      for (let y = 31;y >= 0; y--) {
        if (icon.data[x + y * 32] !== 0) {
          continue;
        }
        if (x > 0 && icon.data[x + y * 32 - 1] > 1) {
          icon.data[x + y * 32] = 1;
        } else if (y > 0 && icon.data[x + (y - 1) * 32] > 1) {
          icon.data[x + y * 32] = 1;
        } else if (x < 31 && icon.data[x + y * 32 + 1] > 1) {
          icon.data[x + y * 32] = 1;
        } else if (y < 31 && icon.data[x + (y + 1) * 32] > 1) {
          icon.data[x + y * 32] = 1;
        }
      }
    }
    for (let x = 31;x >= 0; x--) {
      for (let y = 31;y >= 0; y--) {
        if (icon.data[x + y * 32] === 0 && x > 0 && y > 0 && icon.data[x + (y - 1) * 32 - 1] > 0) {
          icon.data[x + y * 32] = 3153952;
        }
      }
    }
    if (obj.certtemplate !== -1) {
      const linkedIcon = this.getSprite(obj.certlink, 10);
      const w = linkedIcon.owi;
      const h = linkedIcon.ohi;
      linkedIcon.owi = 32;
      linkedIcon.ohi = 32;
      linkedIcon.scalePlotSprite(5, 5, 22, 22);
      linkedIcon.owi = w;
      linkedIcon.ohi = h;
    }
    ObjType.spriteCache.put(BigInt(id), icon);
    Pix2D.setPixels(_data, _w, _h);
    Pix2D.setClipping(_l, _t, _r, _b);
    Pix3D.originX = _cx;
    Pix3D.originY = _cy;
    Pix3D.scanline = _loff;
    Pix3D.lowDetail = true;
    if (obj.stackable) {
      icon.owi = 33;
    } else {
      icon.owi = 32;
    }
    icon.ohi = count;
    return icon;
  }
  getWearModel(gender) {
    let id1 = this.manwear;
    if (gender === 1) {
      id1 = this.womanwear;
    }
    if (id1 === -1) {
      return null;
    }
    let id2 = this.manwear2;
    let id3 = this.manwear3;
    if (gender === 1) {
      id2 = this.womanwear2;
      id3 = this.womanwear3;
    }
    let model = Model.load(id1);
    if (id2 !== -1) {
      const model2 = Model.load(id2);
      if (id3 === -1) {
        const models = [model, model2];
        model = Model.combineForAnim(models, 2);
      } else {
        const model3 = Model.load(id3);
        const models = [model, model2, model3];
        model = Model.combineForAnim(models, 3);
      }
    }
    if (gender === 0 && this.manwearOffset !== 0) {
      model.translate(this.manwearOffset, 0, 0);
    } else if (gender === 1 && this.womanwearOffset !== 0) {
      model.translate(this.womanwearOffset, 0, 0);
    }
    if (this.recol_s && this.recol_d) {
      for (let i = 0;i < this.recol_s.length; i++) {
        model.recolour(this.recol_s[i], this.recol_d[i]);
      }
    }
    return model;
  }
  getHeadModel(gender) {
    let head1 = this.manhead;
    if (gender === 1) {
      head1 = this.womanhead;
    }
    if (head1 === -1) {
      return null;
    }
    let head2 = this.manhead2;
    if (gender === 1) {
      head2 = this.womanhead2;
    }
    let model = Model.load(head1);
    if (head2 !== -1) {
      const model2 = Model.load(head2);
      const models = [model, model2];
      model = Model.combineForAnim(models, 2);
    }
    if (this.recol_s && this.recol_d) {
      for (let i = 0;i < this.recol_s.length; i++) {
        model.recolour(this.recol_s[i], this.recol_d[i]);
      }
    }
    return model;
  }
}

// src/config/NpcType.ts
class NpcType {
  static numDefinitions = 0;
  static idx = null;
  static dat = null;
  static recent = null;
  static recentPos = 0;
  static modelCache = new LruCache(30);
  id = -1;
  name = null;
  desc = null;
  size = 1;
  model = null;
  head = null;
  readyanim = -1;
  walkanim = -1;
  walkanim_b = -1;
  walkanim_r = -1;
  walkanim_l = -1;
  animateTransparencies = false;
  recol_s = null;
  recol_d = null;
  op = null;
  minimap = true;
  vislevel = -1;
  resizeh = 128;
  resizev = 128;
  static init(config) {
    this.dat = new Packet(config.read("npc.dat"));
    const idx = new Packet(config.read("npc.idx"));
    this.numDefinitions = idx.g2();
    this.idx = new Int32Array(this.numDefinitions);
    let offset = 2;
    for (let id = 0;id < this.numDefinitions; id++) {
      this.idx[id] = offset;
      offset += idx.g2();
    }
    this.recent = new TypedArray1d(20, null);
    for (let id = 0;id < 20; id++) {
      this.recent[id] = new NpcType;
    }
  }
  static list(id) {
    if (!this.recent || !this.idx || !this.dat) {
      throw new Error;
    }
    for (let i = 0;i < 20; i++) {
      const type = this.recent[i];
      if (type && type.id === id) {
        return type;
      }
    }
    this.recentPos = (this.recentPos + 1) % 20;
    const npc = this.recent[this.recentPos] = new NpcType;
    this.dat.pos = this.idx[id];
    npc.id = id;
    npc.decode(this.dat);
    return npc;
  }
  decode(dat) {
    while (true) {
      const code = dat.g1();
      if (code === 0) {
        break;
      }
      if (code === 1) {
        const count = dat.g1();
        this.model = new Uint16Array(count);
        for (let i = 0;i < count; i++) {
          this.model[i] = dat.g2();
        }
      } else if (code === 2) {
        this.name = dat.gjstr();
      } else if (code === 3) {
        this.desc = dat.gjstr();
      } else if (code === 12) {
        this.size = dat.g1b();
      } else if (code === 13) {
        this.readyanim = dat.g2();
      } else if (code === 14) {
        this.walkanim = dat.g2();
      } else if (code === 16) {
        this.animateTransparencies = true;
      } else if (code === 17) {
        this.walkanim = dat.g2();
        this.walkanim_b = dat.g2();
        this.walkanim_r = dat.g2();
        this.walkanim_l = dat.g2();
      } else if (code >= 30 && code < 40) {
        if (!this.op) {
          this.op = new TypedArray1d(5, null);
        }
        this.op[code - 30] = dat.gjstr();
        if (this.op[code - 30]?.toLowerCase() === "hidden") {
          this.op[code - 30] = null;
        }
      } else if (code === 40) {
        const count = dat.g1();
        this.recol_s = new Uint16Array(count);
        this.recol_d = new Uint16Array(count);
        for (let i = 0;i < count; i++) {
          this.recol_s[i] = dat.g2();
          this.recol_d[i] = dat.g2();
        }
      } else if (code === 60) {
        const count = dat.g1();
        this.head = new Uint16Array(count);
        for (let i = 0;i < count; i++) {
          this.head[i] = dat.g2();
        }
      } else if (code === 90) {
        dat.pos += 2;
      } else if (code === 91) {
        dat.pos += 2;
      } else if (code === 92) {
        dat.pos += 2;
      } else if (code === 93) {
        this.minimap = false;
      } else if (code === 95) {
        this.vislevel = dat.g2();
      } else if (code === 97) {
        this.resizeh = dat.g2();
      } else if (code === 98) {
        this.resizev = dat.g2();
      }
    }
  }
  getTempModel(primaryTransformId, secondaryTransformId, seqMask) {
    let model = NpcType.modelCache.find(BigInt(this.id));
    if (!model && this.model) {
      const models = new TypedArray1d(this.model.length, null);
      for (let i = 0;i < this.model.length; i++) {
        models[i] = Model.load(this.model[i]);
      }
      if (models.length === 1) {
        model = models[0];
      } else {
        model = Model.combineForAnim(models, models.length);
      }
      if (model) {
        if (this.recol_s && this.recol_d) {
          for (let i = 0;i < this.recol_s.length; i++) {
            model.recolour(this.recol_s[i], this.recol_d[i]);
          }
        }
        model.prepareAnim();
        model.calculateNormals(64, 850, -30, -50, -30, true);
        NpcType.modelCache.put(BigInt(this.id), model);
      }
    }
    if (!model) {
      return null;
    }
    const tmp = Model.set(model, !this.animateTransparencies);
    if (primaryTransformId !== -1 && secondaryTransformId !== -1) {
      tmp.maskAnimate(primaryTransformId, secondaryTransformId, seqMask);
    } else if (primaryTransformId !== -1) {
      tmp.animate(primaryTransformId);
    }
    if (this.resizeh !== 128 || this.resizev !== 128) {
      tmp.resize(this.resizeh, this.resizev, this.resizeh);
    }
    tmp.calcBoundingCylinder();
    tmp.labelFaces = null;
    tmp.labelVertices = null;
    if (this.size === 1) {
      tmp.useAABBMouseCheck = true;
    }
    return tmp;
  }
  getHead() {
    if (!this.head) {
      return null;
    }
    const models = new TypedArray1d(this.head.length, null);
    for (let i = 0;i < this.head.length; i++) {
      models[i] = Model.load(this.head[i]);
    }
    let model;
    if (models.length === 1) {
      model = models[0];
    } else {
      model = Model.combineForAnim(models, models.length);
    }
    if (model && this.recol_s && this.recol_d) {
      for (let i = 0;i < this.recol_s.length; i++) {
        model.recolour(this.recol_s[i], this.recol_d[i]);
      }
    }
    return model;
  }
}

// src/config/IdkType.ts
class IdkType {
  static numDefinitions = 0;
  static list = [];
  part = -1;
  model = null;
  recol_s = new Int32Array(6);
  recol_d = new Int32Array(6);
  head = new Int32Array(5).fill(-1);
  disable = false;
  static init(config) {
    const dat = new Packet(config.read("idk.dat"));
    this.numDefinitions = dat.g2();
    this.list = new Array(this.numDefinitions);
    for (let id = 0;id < this.numDefinitions; id++) {
      if (!this.list[id]) {
        this.list[id] = new IdkType;
      }
      this.list[id].decode(dat);
    }
  }
  decode(dat) {
    while (true) {
      const code = dat.g1();
      if (code === 0) {
        break;
      }
      if (code === 1) {
        this.part = dat.g1();
      } else if (code === 2) {
        const count = dat.g1();
        this.model = new Int32Array(count);
        for (let i = 0;i < count; i++) {
          this.model[i] = dat.g2();
        }
      } else if (code === 3) {
        this.disable = true;
      } else if (code >= 40 && code < 50) {
        this.recol_s[code - 40] = dat.g2();
      } else if (code >= 50 && code < 60) {
        this.recol_d[code - 50] = dat.g2();
      } else if (code >= 60 && code < 70) {
        this.head[code - 60] = dat.g2();
      } else {
        console.log("Error unrecognised config code: ", code);
      }
    }
  }
  getModel() {
    if (!this.model) {
      return null;
    }
    const models = new TypedArray1d(this.model.length, null);
    for (let i = 0;i < this.model.length; i++) {
      models[i] = Model.load(this.model[i]);
    }
    let model;
    if (models.length === 1) {
      model = models[0];
    } else {
      model = Model.combineForAnim(models, models.length);
    }
    for (let i = 0;i < 6 && this.recol_s[i] !== 0; i++) {
      model?.recolour(this.recol_s[i], this.recol_d[i]);
    }
    return model;
  }
  getHead() {
    let count = 0;
    const models = new TypedArray1d(5, null);
    for (let i = 0;i < 5; i++) {
      if (this.head[i] !== -1) {
        models[count++] = Model.load(this.head[i]);
      }
    }
    const model = Model.combineForAnim(models, count);
    for (let i = 0;i < 6 && this.recol_s[i] !== 0; i++) {
      model.recolour(this.recol_s[i], this.recol_d[i]);
    }
    return model;
  }
}

// src/config/SpotType.ts
class SpotType {
  static numDefinitions = 0;
  static list = [];
  static modelCache = new LruCache(30);
  id = 0;
  model = 0;
  anim = -1;
  seq = null;
  animateTransparencies = false;
  recol_s = new Uint16Array(6);
  recol_d = new Uint16Array(6);
  resizeh = 128;
  resizev = 128;
  angle = 0;
  ambient = 0;
  contrast = 0;
  static init(config) {
    const dat = new Packet(config.read("spotanim.dat"));
    this.numDefinitions = dat.g2();
    this.list = new Array(this.numDefinitions);
    for (let id = 0;id < this.numDefinitions; id++) {
      if (!this.list[id]) {
        this.list[id] = new SpotType;
      }
      this.list[id].id = id;
      this.list[id].decode(dat);
    }
  }
  decode(dat) {
    while (true) {
      const code = dat.g1();
      if (code === 0) {
        break;
      }
      if (code === 1) {
        this.model = dat.g2();
      } else if (code === 2) {
        this.anim = dat.g2();
        if (SeqType.list) {
          this.seq = SeqType.list[this.anim];
        }
      } else if (code === 3) {
        this.animateTransparencies = true;
      } else if (code === 4) {
        this.resizeh = dat.g2();
      } else if (code === 5) {
        this.resizev = dat.g2();
      } else if (code === 6) {
        this.angle = dat.g2();
      } else if (code === 7) {
        this.ambient = dat.g1();
      } else if (code === 8) {
        this.contrast = dat.g1();
      } else if (code >= 40 && code < 50) {
        this.recol_s[code - 40] = dat.g2();
      } else if (code >= 50 && code < 60) {
        this.recol_d[code - 50] = dat.g2();
      } else {
        console.log("Error unrecognised spotanim config code: ", code);
      }
    }
  }
  getTempModel2() {
    let model = SpotType.modelCache.find(BigInt(this.id));
    if (model) {
      return model;
    }
    model = Model.load(this.model);
    for (let i = 0;i < 6; i++) {
      if (this.recol_s[0] !== 0) {
        model.recolour(this.recol_s[i], this.recol_d[i]);
      }
    }
    SpotType.modelCache.put(BigInt(this.id), model);
    return model;
  }
}

// src/config/VarpType.ts
class VarpType {
  static numDefinitions = 0;
  static list = [];
  clientcode = 0;
  static init(config) {
    const dat = new Packet(config.read("varp.dat"));
    this.numDefinitions = dat.g2();
    this.list = new Array(this.numDefinitions);
    for (let id = 0;id < this.numDefinitions; id++) {
      if (!this.list[id]) {
        this.list[id] = new VarpType;
      }
      this.list[id].decode(dat);
    }
    if (dat.pos != dat.data.length) {
      console.log("varptype load mismatch");
    }
  }
  decode(dat) {
    while (true) {
      const code = dat.g1();
      if (code === 0) {
        break;
      }
      if (code === 1) {
        dat.pos += 1;
      } else if (code === 2) {
        dat.pos += 1;
      } else if (code === 3) {} else if (code === 4) {} else if (code === 5) {
        this.clientcode = dat.g2();
      } else if (code === 6) {} else if (code === 7) {
        dat.pos += 4;
      } else if (code === 8) {} else if (code === 10) {
        dat.gjstr();
      } else {
        console.log("Error unrecognised config code: ", code);
      }
    }
  }
}

// src/datastruct/JString.ts
class JString {
  static USERHASH_CHAR = [
    "_",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9"
  ];
  static toUserhash(string) {
    string = string.trim();
    let l = 0n;
    for (let i = 0;i < string.length && i < 12; i++) {
      const c = string.charCodeAt(i);
      l *= 37n;
      if (c >= 65 && c <= 90) {
        l += BigInt(c + 1 - 65);
      } else if (c >= 97 && c <= 122) {
        l += BigInt(c + 1 - 97);
      } else if (c >= 48 && c <= 57) {
        l += BigInt(c + 27 - 48);
      }
    }
    while (l % 37n === 0n && l !== 0n) {
      l /= 37n;
    }
    return l;
  }
  static toRawUsername(value) {
    if (value < 0n || value >= 6582952005840035281n) {
      return "invalid_name";
    }
    if (value % 37n === 0n) {
      return "invalid_name";
    }
    let len = 0;
    const chars = Array(12);
    while (value !== 0n) {
      const l1 = value;
      value /= 37n;
      chars[11 - len++] = this.USERHASH_CHAR[Number(l1 - value * 37n)];
    }
    return chars.slice(12 - len).join("");
  }
  static toSentenceCase(input) {
    const chars = [...input.toLowerCase()];
    let punctuation = true;
    for (let index = 0;index < chars.length; index++) {
      const char = chars[index];
      if (punctuation && char >= "a" && char <= "z") {
        chars[index] = char.toUpperCase();
        punctuation = false;
      }
      if (char === "." || char === "!") {
        punctuation = true;
      }
    }
    return chars.join("");
  }
  static getRepeatedCharacter(str) {
    let temp = "";
    for (let i = 0;i < str.length; i++) {
      temp = temp + "*";
    }
    return temp;
  }
  static formatIPv4(ip) {
    return (ip >> 24 & 255) + "." + (ip >> 16 & 255) + "." + (ip >> 8 & 255) + "." + (ip & 255);
  }
  static toScreenName(str) {
    if (str.length === 0) {
      return str;
    }
    const chars = [...str];
    for (let i = 0;i < chars.length; i++) {
      if (chars[i] === "_") {
        chars[i] = " ";
        if (i + 1 < chars.length && chars[i + 1] >= "a" && chars[i + 1] <= "z") {
          chars[i + 1] = String.fromCharCode(chars[i + 1].charCodeAt(0) + 65 - 97);
        }
      }
    }
    if (chars[0] >= "a" && chars[0] <= "z") {
      chars[0] = String.fromCharCode(chars[0].charCodeAt(0) + 65 - 97);
    }
    return chars.join("");
  }
  static hashCode(str) {
    const upper = str.toUpperCase();
    let hash = 0n;
    for (let i = 0;i < upper.length; i++) {
      hash = hash * 61n + BigInt(upper.charCodeAt(i)) - 32n;
      hash = hash + (hash >> 56n) & 0xffffffffffffffn;
    }
    return hash;
  }
}

// src/config/IfType.ts
class IfType {
  static list = [];
  static modelCache = null;
  static spriteCache = null;
  animFrame = 0;
  animCycle = 0;
  id = -1;
  layerId = -1;
  type = -1;
  buttonType = -1;
  clientCode = 0;
  width = 0;
  height = 0;
  overLayerId = -1;
  x = 0;
  y = 0;
  scripts = null;
  scriptComparator = null;
  scriptOperand = null;
  scrollHeight = 0;
  scrollPos = 0;
  hide = false;
  children = null;
  childX = null;
  childY = null;
  linkObjType = null;
  linkObjNumber = null;
  objSwap = false;
  objOps = false;
  objUse = false;
  marginX = 0;
  marginY = 0;
  invBackgroundX = null;
  invBackgroundY = null;
  invBackground = null;
  iop = null;
  fill = false;
  centre = false;
  font = null;
  shadow = false;
  text = null;
  text2 = null;
  colour = 0;
  colour2 = 0;
  colourOver = 0;
  graphic = null;
  graphic2 = null;
  model1 = null;
  model2 = null;
  modelAnim = -1;
  modelAnim2 = -1;
  modelZoom = 0;
  modelXAn = 0;
  modelYAn = 0;
  targetVerb = null;
  targetBase = null;
  targetMask = -1;
  buttonText = null;
  static init(interfaces, media, fonts) {
    this.spriteCache = new LruCache(50000);
    this.modelCache = new LruCache(50000);
    const data = new Packet(interfaces.read("data"));
    let layer = -1;
    const count = data.g2();
    this.list = new Array(count);
    while (data.pos < data.length) {
      let id = data.g2();
      if (id === 65535) {
        layer = data.g2();
        id = data.g2();
      }
      const com = this.list[id] = new IfType;
      com.id = id;
      com.layerId = layer;
      com.type = data.g1();
      com.buttonType = data.g1();
      com.clientCode = data.g2();
      com.width = data.g2();
      com.height = data.g2();
      com.overLayerId = data.g1();
      if (com.overLayerId === 0) {
        com.overLayerId = -1;
      } else {
        com.overLayerId = (com.overLayerId - 1 << 8) + data.g1();
      }
      const scriptStackCount = data.g1();
      if (scriptStackCount > 0) {
        com.scriptComparator = new Uint8Array(scriptStackCount);
        com.scriptOperand = new Uint16Array(scriptStackCount);
        for (let i = 0;i < scriptStackCount; i++) {
          com.scriptComparator[i] = data.g1();
          com.scriptOperand[i] = data.g2();
        }
      }
      const scriptCount = data.g1();
      if (scriptCount > 0) {
        com.scripts = new TypedArray1d(scriptCount, null);
        for (let i = 0;i < scriptCount; i++) {
          const opcodeCount = data.g2();
          const script = new Uint16Array(opcodeCount);
          com.scripts[i] = script;
          for (let j = 0;j < opcodeCount; j++) {
            script[j] = data.g2();
          }
        }
      }
      if (com.type === 0 /* TYPE_LAYER */) {
        com.scrollHeight = data.g2();
        com.hide = data.g1() === 1;
        const childCount = data.g1();
        com.children = new Array(childCount);
        com.childX = new Array(childCount);
        com.childY = new Array(childCount);
        for (let i = 0;i < childCount; i++) {
          com.children[i] = data.g2();
          com.childX[i] = data.g2b();
          com.childY[i] = data.g2b();
        }
      }
      if (com.type === 1 /* TYPE_UNUSED */) {
        data.pos += 3;
      }
      if (com.type === 2 /* TYPE_INV */) {
        com.linkObjType = new Int32Array(com.width * com.height);
        com.linkObjNumber = new Int32Array(com.width * com.height);
        com.objSwap = data.g1() === 1;
        com.objOps = data.g1() === 1;
        com.objUse = data.g1() === 1;
        com.marginX = data.g1();
        com.marginY = data.g1();
        com.invBackgroundX = new Int16Array(20);
        com.invBackgroundY = new Int16Array(20);
        com.invBackground = new TypedArray1d(20, null);
        for (let i = 0;i < 20; i++) {
          if (data.g1() === 1) {
            com.invBackgroundX[i] = data.g2b();
            com.invBackgroundY[i] = data.g2b();
            const graphic = data.gjstr();
            if (graphic.length > 0) {
              const spriteIndex = graphic.lastIndexOf(",");
              com.invBackground[i] = this.getSprite(media, graphic.substring(0, spriteIndex), parseInt(graphic.substring(spriteIndex + 1)));
            }
          }
        }
        com.iop = new TypedArray1d(5, null);
        for (let i = 0;i < 5; i++) {
          com.iop[i] = data.gjstr();
          if (com.iop[i].length === 0) {
            com.iop[i] = null;
          }
        }
      }
      if (com.type === 3 /* TYPE_RECT */) {
        com.fill = data.g1() === 1;
      }
      if (com.type === 4 /* TYPE_TEXT */ || com.type === 1 /* TYPE_UNUSED */) {
        com.centre = data.g1() === 1;
        const font = data.g1();
        if (fonts) {
          com.font = fonts[font];
        }
        com.shadow = data.g1() === 1;
      }
      if (com.type === 4 /* TYPE_TEXT */) {
        com.text = data.gjstr();
        com.text2 = data.gjstr();
      }
      if (com.type === 1 /* TYPE_UNUSED */ || com.type === 3 /* TYPE_RECT */ || com.type === 4 /* TYPE_TEXT */) {
        com.colour = data.g4();
      }
      if (com.type === 3 /* TYPE_RECT */ || com.type === 4 /* TYPE_TEXT */) {
        com.colour2 = data.g4();
        com.colourOver = data.g4();
      }
      if (com.type === 5 /* TYPE_GRAPHIC */) {
        const graphic = data.gjstr();
        if (graphic.length > 0) {
          const index = graphic.lastIndexOf(",");
          com.graphic = this.getSprite(media, graphic.substring(0, index), parseInt(graphic.substring(index + 1), 10));
        }
        const graphic2 = data.gjstr();
        if (graphic2.length > 0) {
          const index = graphic2.lastIndexOf(",");
          com.graphic2 = this.getSprite(media, graphic2.substring(0, index), parseInt(graphic2.substring(index + 1), 10));
        }
      }
      if (com.type === 6 /* TYPE_MODEL */) {
        const model = data.g1();
        if (model !== 0) {
          com.model1 = this.getModel((model - 1 << 8) + data.g1());
        }
        const activeModel = data.g1();
        if (activeModel !== 0) {
          com.model2 = this.getModel((activeModel - 1 << 8) + data.g1());
        }
        com.modelAnim = data.g1();
        if (com.modelAnim === 0) {
          com.modelAnim = -1;
        } else {
          com.modelAnim = (com.modelAnim - 1 << 8) + data.g1();
        }
        com.modelAnim2 = data.g1();
        if (com.modelAnim2 === 0) {
          com.modelAnim2 = -1;
        } else {
          com.modelAnim2 = (com.modelAnim2 - 1 << 8) + data.g1();
        }
        com.modelZoom = data.g2();
        com.modelXAn = data.g2();
        com.modelYAn = data.g2();
      }
      if (com.type === 7 /* TYPE_INV_TEXT */) {
        com.linkObjType = new Int32Array(com.width * com.height);
        com.linkObjNumber = new Int32Array(com.width * com.height);
        com.centre = data.g1() === 1;
        const font = data.g1();
        if (fonts) {
          com.font = fonts[font];
        }
        com.shadow = data.g1() === 1;
        com.colour = data.g4();
        com.marginX = data.g2b();
        com.marginY = data.g2b();
        com.objOps = data.g1() === 1;
        com.iop = new TypedArray1d(5, null);
        for (let i = 0;i < 5; i++) {
          com.iop[i] = data.gjstr();
          if (com.iop[i].length === 0) {
            com.iop[i] = null;
          }
        }
      }
      if (com.buttonType === 2 /* BUTTON_TARGET */ || com.type === 2 /* TYPE_INV */) {
        com.targetVerb = data.gjstr();
        com.targetBase = data.gjstr();
        com.targetMask = data.g2();
      }
      if (com.buttonType === 1 /* BUTTON_OK */ || com.buttonType === 4 /* BUTTON_TOGGLE */ || com.buttonType === 5 /* BUTTON_SELECT */ || com.buttonType === 6 /* BUTTON_CONTINUE */) {
        com.buttonText = data.gjstr();
        if (com.buttonText.length === 0) {
          if (com.buttonType === 1 /* BUTTON_OK */) {
            com.buttonText = "Ok";
          } else if (com.buttonType === 4 /* BUTTON_TOGGLE */) {
            com.buttonText = "Select";
          } else if (com.buttonType === 5 /* BUTTON_SELECT */) {
            com.buttonText = "Select";
          } else if (com.buttonType === 6 /* BUTTON_CONTINUE */) {
            com.buttonText = "Continue";
          }
        }
      }
    }
    this.spriteCache = null;
    this.modelCache = null;
  }
  getTempModel(primaryFrame, secondaryFrame, active) {
    let model = this.model1;
    if (active) {
      model = this.model2;
    }
    if (!model) {
      return null;
    }
    if (primaryFrame === -1 && secondaryFrame === -1 && !model.faceColour) {
      return model;
    }
    const tmp = Model.copyForAnim(model, true, true, false);
    if (primaryFrame !== -1 || secondaryFrame !== -1) {
      tmp.prepareAnim();
    }
    if (primaryFrame !== -1) {
      tmp.animate(primaryFrame);
    }
    if (secondaryFrame !== -1) {
      tmp.animate(secondaryFrame);
    }
    tmp.calculateNormals(64, 768, -50, -10, -50, true);
    return tmp;
  }
  static getModel(id) {
    if (this.modelCache) {
      const model2 = this.modelCache.find(BigInt(id));
      if (model2) {
        return model2;
      }
    }
    const model = Model.load(id);
    this.modelCache?.put(BigInt(id), model);
    return model;
  }
  static getSprite(media, name, spriteIndex) {
    const uid = JString.hashCode(name) << 8n | BigInt(spriteIndex);
    if (this.spriteCache) {
      const image = this.spriteCache.find(uid);
      if (image) {
        return image;
      }
    }
    try {
      const image = Pix32.depack(media, name, spriteIndex);
      this.spriteCache?.put(uid, image);
      return image;
    } catch (_e) {
      return null;
    }
  }
}

// src/dash3d/CollisionMap.ts
class CollisionMap {
  static index = (x, z) => x * 104 /* SIZE */ + z;
  startX = 0;
  startZ = 0;
  sizeX;
  sizeZ;
  flags;
  constructor() {
    this.sizeX = 104 /* SIZE */;
    this.sizeZ = 104 /* SIZE */;
    this.flags = new Int32Array(this.sizeX * this.sizeZ);
    this.reset();
  }
  reset() {
    for (let x = 0;x < this.sizeX; x++) {
      for (let z = 0;z < this.sizeZ; z++) {
        const index = CollisionMap.index(x, z);
        if (x === 0 || z === 0 || x === this.sizeX - 1 || z === this.sizeZ - 1) {
          this.flags[index] = 16777215 /* _BOUNDS */;
        } else {
          this.flags[index] = 0 /* _OPEN */;
        }
      }
    }
  }
  blockGround(tileX, tileZ) {
    this.flags[CollisionMap.index(tileX - this.startX, tileZ - this.startZ)] |= 2097152 /* WR_GRND */;
  }
  unblockGround(tileX, tileZ) {
    this.flags[CollisionMap.index(tileX - this.startX, tileZ - this.startZ)] &= ~2097152 /* WR_GRND */;
  }
  addLoc(tileX, tileZ, sizeX, sizeZ, angle, blockrange) {
    let flags = 256 /* WALK_SCENERY */;
    if (blockrange) {
      flags |= 131072 /* VIS_SCENERY */;
    }
    const x = tileX - this.startX;
    const z = tileZ - this.startZ;
    if (angle === 1 /* NORTH */ || angle === 3 /* SOUTH */) {
      const tmp = sizeX;
      sizeX = sizeZ;
      sizeZ = tmp;
    }
    for (let tx = x;tx < x + sizeX; tx++) {
      if (!(tx >= 0 && tx < this.sizeX)) {
        continue;
      }
      for (let tz = z;tz < z + sizeZ; tz++) {
        if (!(tz >= 0 && tz < this.sizeZ)) {
          continue;
        }
        this.addCMap(tx, tz, flags);
      }
    }
  }
  delLoc(tileX, tileZ, sizeX, sizeZ, angle, blockrange) {
    let flags = 256 /* WALK_SCENERY */;
    if (blockrange) {
      flags |= 131072 /* VIS_SCENERY */;
    }
    const x = tileX - this.startX;
    const z = tileZ - this.startZ;
    if (angle === 1 /* NORTH */ || angle === 3 /* SOUTH */) {
      const tmp = sizeX;
      sizeX = sizeZ;
      sizeZ = tmp;
    }
    for (let tx = x;tx < x + sizeX; tx++) {
      if (!(tx >= 0 && tx < this.sizeX)) {
        continue;
      }
      for (let tz = z;tz < z + sizeZ; tz++) {
        if (!(tz >= 0 && tz < this.sizeZ)) {
          continue;
        }
        this.remCMap(tx, tz, flags);
      }
    }
  }
  addWall(tileX, tileZ, shape, angle, blockrange) {
    const x = tileX - this.startX;
    const z = tileZ - this.startZ;
    const west = blockrange ? 65536 /* V_W */ : 128 /* W_W */;
    const east = blockrange ? 4096 /* V_E */ : 8 /* W_E */;
    const north = blockrange ? 1024 /* V_N */ : 2 /* W_N */;
    const south = blockrange ? 16384 /* V_S */ : 32 /* W_S */;
    const northWest = blockrange ? 512 /* V_NW */ : 1 /* W_NW */;
    const southEast = blockrange ? 8192 /* V_SE */ : 16 /* W_SE */;
    const northEast = blockrange ? 2048 /* V_NE */ : 4 /* W_NE */;
    const southWest = blockrange ? 32768 /* V_SW */ : 64 /* W_SW */;
    if (shape === 0 /* WALL_STRAIGHT */) {
      if (angle === 0 /* WEST */) {
        this.addCMap(x, z, west);
        this.addCMap(x - 1, z, east);
      } else if (angle === 1 /* NORTH */) {
        this.addCMap(x, z, north);
        this.addCMap(x, z + 1, south);
      } else if (angle === 2 /* EAST */) {
        this.addCMap(x, z, east);
        this.addCMap(x + 1, z, west);
      } else if (angle === 3 /* SOUTH */) {
        this.addCMap(x, z, south);
        this.addCMap(x, z - 1, north);
      }
    } else if (shape === 1 /* WALL_DIAGONAL_CORNER */ || shape === 3 /* WALL_SQUARE_CORNER */) {
      if (angle === 0 /* WEST */) {
        this.addCMap(x, z, northWest);
        this.addCMap(x - 1, z + 1, southEast);
      } else if (angle === 1 /* NORTH */) {
        this.addCMap(x, z, northEast);
        this.addCMap(x + 1, z + 1, southWest);
      } else if (angle === 2 /* EAST */) {
        this.addCMap(x, z, southEast);
        this.addCMap(x + 1, z - 1, northWest);
      } else if (angle === 3 /* SOUTH */) {
        this.addCMap(x, z, southWest);
        this.addCMap(x - 1, z - 1, northEast);
      }
    } else if (shape === 2 /* WALL_L */) {
      if (angle === 0 /* WEST */) {
        this.addCMap(x, z, north | west);
        this.addCMap(x - 1, z, east);
        this.addCMap(x, z + 1, south);
      } else if (angle === 1 /* NORTH */) {
        this.addCMap(x, z, north | east);
        this.addCMap(x, z + 1, south);
        this.addCMap(x + 1, z, west);
      } else if (angle === 2 /* EAST */) {
        this.addCMap(x, z, south | east);
        this.addCMap(x + 1, z, west);
        this.addCMap(x, z - 1, north);
      } else if (angle === 3 /* SOUTH */) {
        this.addCMap(x, z, south | west);
        this.addCMap(x, z - 1, north);
        this.addCMap(x - 1, z, east);
      }
    }
    if (blockrange) {
      this.addWall(tileX, tileZ, shape, angle, false);
    }
  }
  delWall(tileX, tileZ, shape, angle, blockrange) {
    const x = tileX - this.startX;
    const z = tileZ - this.startZ;
    const west = blockrange ? 65536 /* V_W */ : 128 /* W_W */;
    const east = blockrange ? 4096 /* V_E */ : 8 /* W_E */;
    const north = blockrange ? 1024 /* V_N */ : 2 /* W_N */;
    const south = blockrange ? 16384 /* V_S */ : 32 /* W_S */;
    const northWest = blockrange ? 512 /* V_NW */ : 1 /* W_NW */;
    const southEast = blockrange ? 8192 /* V_SE */ : 16 /* W_SE */;
    const northEast = blockrange ? 2048 /* V_NE */ : 4 /* W_NE */;
    const southWest = blockrange ? 32768 /* V_SW */ : 64 /* W_SW */;
    if (shape === 0 /* WALL_STRAIGHT */) {
      if (angle === 0 /* WEST */) {
        this.remCMap(x, z, west);
        this.remCMap(x - 1, z, east);
      } else if (angle === 1 /* NORTH */) {
        this.remCMap(x, z, north);
        this.remCMap(x, z + 1, south);
      } else if (angle === 2 /* EAST */) {
        this.remCMap(x, z, east);
        this.remCMap(x + 1, z, west);
      } else if (angle === 3 /* SOUTH */) {
        this.remCMap(x, z, south);
        this.remCMap(x, z - 1, north);
      }
    } else if (shape === 1 /* WALL_DIAGONAL_CORNER */ || shape === 3 /* WALL_SQUARE_CORNER */) {
      if (angle === 0 /* WEST */) {
        this.remCMap(x, z, northWest);
        this.remCMap(x - 1, z + 1, southEast);
      } else if (angle === 1 /* NORTH */) {
        this.remCMap(x, z, northEast);
        this.remCMap(x + 1, z + 1, southWest);
      } else if (angle === 2 /* EAST */) {
        this.remCMap(x, z, southEast);
        this.remCMap(x + 1, z - 1, northWest);
      } else if (angle === 3 /* SOUTH */) {
        this.remCMap(x, z, southWest);
        this.remCMap(x - 1, z - 1, northEast);
      }
    } else if (shape === 2 /* WALL_L */) {
      if (angle === 0 /* WEST */) {
        this.remCMap(x, z, north | west);
        this.remCMap(x - 1, z, east);
        this.remCMap(x, z + 1, south);
      } else if (angle === 1 /* NORTH */) {
        this.remCMap(x, z, north | east);
        this.remCMap(x, z + 1, south);
        this.remCMap(x + 1, z, west);
      } else if (angle === 2 /* EAST */) {
        this.remCMap(x, z, south | east);
        this.remCMap(x + 1, z, west);
        this.remCMap(x, z - 1, north);
      } else if (angle === 3 /* SOUTH */) {
        this.remCMap(x, z, south | west);
        this.remCMap(x, z - 1, north);
        this.remCMap(x - 1, z, east);
      }
    }
    if (blockrange) {
      this.delWall(tileX, tileZ, shape, angle, false);
    }
  }
  testWall(srcX, srcZ, dstX, dstZ, shape, angle) {
    if (srcX === dstX && srcZ === dstZ) {
      return true;
    }
    const sx = srcX - this.startX;
    const sz = srcZ - this.startZ;
    const dx = dstX - this.startX;
    const dz = dstZ - this.startZ;
    const index = CollisionMap.index(sx, sz);
    if (shape === 0 /* WALL_STRAIGHT */) {
      if (angle === 0 /* WEST */) {
        if (sx === dx - 1 && sz === dz) {
          return true;
        } else if (sx === dx && sz === dz + 1 && (this.flags[index] & 2621728 /* PL_WALK_S */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx && sz === dz - 1 && (this.flags[index] & 2621698 /* PL_WALK_N */) === 0 /* _OPEN */) {
          return true;
        }
      } else if (angle === 1 /* NORTH */) {
        if (sx === dx && sz === dz + 1) {
          return true;
        } else if (sx === dx - 1 && sz === dz && (this.flags[index] & 2621704 /* PL_WALK_E */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx + 1 && sz === dz && (this.flags[index] & 2621824 /* PL_WALK_W */) === 0 /* _OPEN */) {
          return true;
        }
      } else if (angle === 2 /* EAST */) {
        if (sx === dx + 1 && sz === dz) {
          return true;
        } else if (sx === dx && sz === dz + 1 && (this.flags[index] & 2621728 /* PL_WALK_S */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx && sz === dz - 1 && (this.flags[index] & 2621698 /* PL_WALK_N */) === 0 /* _OPEN */) {
          return true;
        }
      } else if (angle === 3 /* SOUTH */) {
        if (sx === dx && sz === dz - 1) {
          return true;
        } else if (sx === dx - 1 && sz === dz && (this.flags[index] & 2621704 /* PL_WALK_E */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx + 1 && sz === dz && (this.flags[index] & 2621824 /* PL_WALK_W */) === 0 /* _OPEN */) {
          return true;
        }
      }
    } else if (shape === 2 /* WALL_L */) {
      if (angle === 0 /* WEST */) {
        if (sx === dx - 1 && sz === dz) {
          return true;
        } else if (sx === dx && sz === dz + 1) {
          return true;
        } else if (sx === dx + 1 && sz === dz && (this.flags[index] & 2621824 /* PL_WALK_W */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx && sz === dz - 1 && (this.flags[index] & 2621698 /* PL_WALK_N */) === 0 /* _OPEN */) {
          return true;
        }
      } else if (angle === 1 /* NORTH */) {
        if (sx === dx - 1 && sz === dz && (this.flags[index] & 2621704 /* PL_WALK_E */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx && sz === dz + 1) {
          return true;
        } else if (sx === dx + 1 && sz === dz) {
          return true;
        } else if (sx === dx && sz === dz - 1 && (this.flags[index] & 2621698 /* PL_WALK_N */) === 0 /* _OPEN */) {
          return true;
        }
      } else if (angle === 2 /* EAST */) {
        if (sx === dx - 1 && sz === dz && (this.flags[index] & 2621704 /* PL_WALK_E */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx && sz === dz + 1 && (this.flags[index] & 2621728 /* PL_WALK_S */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx + 1 && sz === dz) {
          return true;
        } else if (sx === dx && sz === dz - 1) {
          return true;
        }
      } else if (angle === 3 /* SOUTH */) {
        if (sx === dx - 1 && sz === dz) {
          return true;
        } else if (sx === dx && sz === dz + 1 && (this.flags[index] & 2621728 /* PL_WALK_S */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx + 1 && sz === dz && (this.flags[index] & 2621824 /* PL_WALK_W */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx && sz === dz - 1) {
          return true;
        }
      }
    } else if (shape === 9 /* WALL_DIAGONAL */) {
      if (sx === dx && sz === dz + 1 && (this.flags[index] & 32 /* W_S */) === 0 /* _OPEN */) {
        return true;
      } else if (sx === dx && sz === dz - 1 && (this.flags[index] & 2 /* W_N */) === 0 /* _OPEN */) {
        return true;
      } else if (sx === dx - 1 && sz === dz && (this.flags[index] & 8 /* W_E */) === 0 /* _OPEN */) {
        return true;
      } else if (sx === dx + 1 && sz === dz && (this.flags[index] & 128 /* W_W */) === 0 /* _OPEN */) {
        return true;
      }
    }
    return false;
  }
  testWDecor(srcX, srcZ, dstX, dstZ, shape, angle) {
    if (srcX === dstX && srcZ === dstZ) {
      return true;
    }
    const sx = srcX - this.startX;
    const sz = srcZ - this.startZ;
    const dx = dstX - this.startX;
    const dz = dstZ - this.startZ;
    const index = CollisionMap.index(sx, sz);
    if (shape === 6 /* WALLDECOR_DIAGONAL_OFFSET */ || shape === 7 /* WALLDECOR_DIAGONAL_NOOFFSET */) {
      if (shape === 7 /* WALLDECOR_DIAGONAL_NOOFFSET */) {
        angle = angle + 2 & 3;
      }
      if (angle === 0 /* WEST */) {
        if (sx === dx + 1 && sz === dz && (this.flags[index] & 128 /* W_W */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx && sz === dz - 1 && (this.flags[index] & 2 /* W_N */) === 0 /* _OPEN */) {
          return true;
        }
      } else if (angle === 1 /* NORTH */) {
        if (sx === dx - 1 && sz === dz && (this.flags[index] & 8 /* W_E */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx && sz === dz - 1 && (this.flags[index] & 2 /* W_N */) === 0 /* _OPEN */) {
          return true;
        }
      } else if (angle === 2 /* EAST */) {
        if (sx === dx - 1 && sz === dz && (this.flags[index] & 8 /* W_E */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx && sz === dz + 1 && (this.flags[index] & 32 /* W_S */) === 0 /* _OPEN */) {
          return true;
        }
      } else if (angle === 3 /* SOUTH */) {
        if (sx === dx + 1 && sz === dz && (this.flags[index] & 128 /* W_W */) === 0 /* _OPEN */) {
          return true;
        } else if (sx === dx && sz === dz + 1 && (this.flags[index] & 32 /* W_S */) === 0 /* _OPEN */) {
          return true;
        }
      }
    } else if (shape === 8 /* WALLDECOR_DIAGONAL_BOTH */) {
      if (sx === dx && sz === dz + 1 && (this.flags[index] & 32 /* W_S */) === 0 /* _OPEN */) {
        return true;
      } else if (sx === dx && sz === dz - 1 && (this.flags[index] & 2 /* W_N */) === 0 /* _OPEN */) {
        return true;
      } else if (sx === dx - 1 && sz === dz && (this.flags[index] & 8 /* W_E */) === 0 /* _OPEN */) {
        return true;
      } else if (sx === dx + 1 && sz === dz && (this.flags[index] & 128 /* W_W */) === 0 /* _OPEN */) {
        return true;
      }
    }
    return false;
  }
  testLoc(srcX, srcZ, dstX, dstZ, dstSizeX, dstSizeZ, forceapproach) {
    const maxX = dstX + dstSizeX - 1;
    const maxZ = dstZ + dstSizeZ - 1;
    const index = CollisionMap.index(srcX - this.startX, srcZ - this.startZ);
    if (srcX >= dstX && srcX <= maxX && srcZ >= dstZ && srcZ <= maxZ) {
      return true;
    } else if (srcX === dstX - 1 && srcZ >= dstZ && srcZ <= maxZ && (this.flags[index] & 8 /* W_E */) === 0 /* _OPEN */ && (forceapproach & 8 /* WEST */) === 0 /* _OPEN */) {
      return true;
    } else if (srcX === maxX + 1 && srcZ >= dstZ && srcZ <= maxZ && (this.flags[index] & 128 /* W_W */) === 0 /* _OPEN */ && (forceapproach & 2 /* EAST */) === 0 /* _OPEN */) {
      return true;
    } else if (srcZ === dstZ - 1 && srcX >= dstX && srcX <= maxX && (this.flags[index] & 2 /* W_N */) === 0 /* _OPEN */ && (forceapproach & 4 /* SOUTH */) === 0 /* _OPEN */) {
      return true;
    } else if (srcZ === maxZ + 1 && srcX >= dstX && srcX <= maxX && (this.flags[index] & 32 /* W_S */) === 0 /* _OPEN */ && (forceapproach & 1 /* NORTH */) === 0 /* _OPEN */) {
      return true;
    }
    return false;
  }
  addCMap(x, z, flags) {
    this.flags[CollisionMap.index(x, z)] |= flags;
  }
  remCMap(x, z, flags) {
    this.flags[CollisionMap.index(x, z)] &= 16777215 /* _BOUNDS */ - flags;
  }
}

// src/dash3d/Occlude.ts
class Occlude {
  minTileX;
  maxTileX;
  minTileZ;
  maxTileZ;
  type;
  minX;
  maxX;
  minZ;
  maxZ;
  minY;
  maxY;
  mode = 0;
  minDeltaX = 0;
  maxDeltaX = 0;
  minDeltaZ = 0;
  maxDeltaZ = 0;
  minDeltaY = 0;
  maxDeltaY = 0;
  constructor(minTileX, maxTileX, minTileZ, maxTileZ, type, minX, maxX, minZ, maxZ, minY, maxY) {
    this.minTileX = minTileX;
    this.maxTileX = maxTileX;
    this.minTileZ = minTileZ;
    this.maxTileZ = maxTileZ;
    this.type = type;
    this.minX = minX;
    this.maxX = maxX;
    this.minZ = minZ;
    this.maxZ = maxZ;
    this.minY = minY;
    this.maxY = maxY;
  }
}

// src/dash3d/GroundDecor.ts
class GroundDecor {
  y;
  x;
  z;
  model;
  typecode;
  typecode2;
  constructor(y, x, z, model, typecode, info) {
    this.y = y;
    this.x = x;
    this.z = z;
    this.model = model;
    this.typecode = typecode;
    this.typecode2 = info;
  }
}

// src/dash3d/Sprite.ts
class Sprite {
  level;
  y;
  x;
  z;
  model;
  entity;
  yaw;
  minTileX;
  maxTileX;
  minTileZ;
  maxTileZ;
  typecode;
  typecode2;
  distance = 0;
  cycle = 0;
  constructor(level, y, x, z, model, entity, yaw, minSceneTileX, maxSceneTileX, minSceneTileZ, maxSceneTileZ, typecode, info) {
    this.level = level;
    this.y = y;
    this.x = x;
    this.z = z;
    this.model = model;
    this.entity = entity;
    this.yaw = yaw;
    this.minTileX = minSceneTileX;
    this.maxTileX = maxSceneTileX;
    this.minTileZ = minSceneTileZ;
    this.maxTileZ = maxSceneTileZ;
    this.typecode = typecode;
    this.typecode2 = info;
  }
}

// src/dash3d/GroundObject.ts
class GroundObject {
  y;
  x;
  z;
  topObj;
  middleObj;
  bottomObj;
  typecode;
  height;
  constructor(y, x, z, topObj, middleObj, bottomObj, typecode, offset) {
    this.y = y;
    this.x = x;
    this.z = z;
    this.topObj = topObj;
    this.middleObj = middleObj;
    this.bottomObj = bottomObj;
    this.typecode = typecode;
    this.height = offset;
  }
}

// src/dash3d/Square.ts
class Square extends Linkable {
  level;
  x;
  z;
  originalLevel;
  sprites = new TypedArray1d(5, null);
  spriteSpan = new Int32Array(5);
  quickGround = null;
  ground = null;
  wall = null;
  decor = null;
  groundDecor = null;
  groundObject = null;
  linkedSquare = null;
  spriteCount = 0;
  spriteSpans = 0;
  drawLevel = 0;
  drawFront = false;
  drawBack = false;
  drawSprites = false;
  cornerSides = 0;
  sidesBeforeCorner = 0;
  sidesAfterCorner = 0;
  backWallTypes = 0;
  constructor(level, x, z) {
    super();
    this.originalLevel = this.level = level;
    this.x = x;
    this.z = z;
  }
}

// src/dash3d/Ground.ts
var defShapeP = [
  Int8Array.of(1, 3, 5, 7),
  Int8Array.of(1, 3, 5, 7),
  Int8Array.of(1, 3, 5, 7),
  Int8Array.of(1, 3, 5, 7, 6),
  Int8Array.of(1, 3, 5, 7, 6),
  Int8Array.of(1, 3, 5, 7, 6),
  Int8Array.of(1, 3, 5, 7, 6),
  Int8Array.of(1, 3, 5, 7, 2, 6),
  Int8Array.of(1, 3, 5, 7, 2, 8),
  Int8Array.of(1, 3, 5, 7, 2, 8),
  Int8Array.of(1, 3, 5, 7, 11, 12),
  Int8Array.of(1, 3, 5, 7, 11, 12),
  Int8Array.of(1, 3, 5, 7, 13, 14)
];
var defShapeF = [
  Int8Array.of(0, 1, 2, 3, 0, 0, 1, 3),
  Int8Array.of(1, 1, 2, 3, 1, 0, 1, 3),
  Int8Array.of(0, 1, 2, 3, 1, 0, 1, 3),
  Int8Array.of(0, 0, 1, 2, 0, 0, 2, 4, 1, 0, 4, 3),
  Int8Array.of(0, 0, 1, 4, 0, 0, 4, 3, 1, 1, 2, 4),
  Int8Array.of(0, 0, 4, 3, 1, 0, 1, 2, 1, 0, 2, 4),
  Int8Array.of(0, 1, 2, 4, 1, 0, 1, 4, 1, 0, 4, 3),
  Int8Array.of(0, 4, 1, 2, 0, 4, 2, 5, 1, 0, 4, 5, 1, 0, 5, 3),
  Int8Array.of(0, 4, 1, 2, 0, 4, 2, 3, 0, 4, 3, 5, 1, 0, 4, 5),
  Int8Array.of(0, 0, 4, 5, 1, 4, 1, 2, 1, 4, 2, 3, 1, 4, 3, 5),
  Int8Array.of(0, 0, 1, 5, 0, 1, 4, 5, 0, 1, 2, 4, 1, 0, 5, 3, 1, 5, 4, 3, 1, 4, 2, 3),
  Int8Array.of(1, 0, 1, 5, 1, 1, 4, 5, 1, 1, 2, 4, 0, 0, 5, 3, 0, 5, 4, 3, 0, 4, 2, 3),
  Int8Array.of(1, 0, 5, 4, 1, 0, 1, 5, 0, 0, 4, 3, 0, 4, 5, 3, 0, 5, 2, 3, 0, 1, 2, 5)
];
var FULL_SQUARE = 128;
var HALF_SQUARE = FULL_SQUARE / 2 | 0;
var CORNER_SMALL = FULL_SQUARE / 4 | 0;
var CORNER_BIG = FULL_SQUARE * 3 / 4 | 0;

class Ground {
  static drawVertexX = new Int32Array(6);
  static drawVertexY = new Int32Array(6);
  static drawTextureVertexX = new Int32Array(6);
  static drawTextureVertexY = new Int32Array(6);
  static drawTextureVertexZ = new Int32Array(6);
  vertexX;
  vertexY;
  vertexZ;
  faceColourA;
  faceColourB;
  faceColourC;
  faceVertexA;
  faceVertexB;
  faceVertexC;
  faceTexture;
  flat;
  minimapUnderlay;
  minimapOverlay;
  overlayShape;
  overlayRotation;
  constructor(x, shape, colour2SE, heightSE, colourNE, rotation, colourSW, heightNW, underlay, colour2SW, texture, colour2NW, overlay, heightNE, colour2NE, colourNW, heightSW, z, colourSE) {
    this.flat = !(heightSW !== heightSE || heightSW !== heightNE || heightSW !== heightNW);
    this.overlayShape = shape;
    this.overlayRotation = rotation;
    this.minimapOverlay = overlay;
    this.minimapUnderlay = underlay;
    const points = defShapeP[shape];
    const vertexCount = points.length;
    this.vertexX = new Int32Array(vertexCount);
    this.vertexY = new Int32Array(vertexCount);
    this.vertexZ = new Int32Array(vertexCount);
    const primaryColours = new Int32Array(vertexCount);
    const secondaryColours = new Int32Array(vertexCount);
    const sceneX = x * FULL_SQUARE;
    const sceneZ = z * FULL_SQUARE;
    for (let v = 0;v < vertexCount; v++) {
      let type = points[v];
      if ((type & 1) === 0 && type <= 8) {
        type = (type - rotation - rotation - 1 & 7) + 1;
      }
      if (type > 8 && type <= 12) {
        type = (type - rotation - 9 & 3) + 9;
      }
      if (type > 12 && type <= 16) {
        type = (type - rotation - 13 & 3) + 13;
      }
      let x2;
      let z2;
      let y;
      let colour1;
      let colour2;
      if (type === 1) {
        x2 = sceneX;
        z2 = sceneZ;
        y = heightSW;
        colour1 = colourSW;
        colour2 = colour2SW;
      } else if (type === 2) {
        x2 = sceneX + HALF_SQUARE;
        z2 = sceneZ;
        y = heightSW + heightSE >> 1;
        colour1 = colourSW + colourSE >> 1;
        colour2 = colour2SW + colour2SE >> 1;
      } else if (type === 3) {
        x2 = sceneX + FULL_SQUARE;
        z2 = sceneZ;
        y = heightSE;
        colour1 = colourSE;
        colour2 = colour2SE;
      } else if (type === 4) {
        x2 = sceneX + FULL_SQUARE;
        z2 = sceneZ + HALF_SQUARE;
        y = heightSE + heightNE >> 1;
        colour1 = colourSE + colourNE >> 1;
        colour2 = colour2SE + colour2NE >> 1;
      } else if (type === 5) {
        x2 = sceneX + FULL_SQUARE;
        z2 = sceneZ + FULL_SQUARE;
        y = heightNE;
        colour1 = colourNE;
        colour2 = colour2NE;
      } else if (type === 6) {
        x2 = sceneX + HALF_SQUARE;
        z2 = sceneZ + FULL_SQUARE;
        y = heightNE + heightNW >> 1;
        colour1 = colourNE + colourNW >> 1;
        colour2 = colour2NE + colour2NW >> 1;
      } else if (type === 7) {
        x2 = sceneX;
        z2 = sceneZ + FULL_SQUARE;
        y = heightNW;
        colour1 = colourNW;
        colour2 = colour2NW;
      } else if (type === 8) {
        x2 = sceneX;
        z2 = sceneZ + HALF_SQUARE;
        y = heightNW + heightSW >> 1;
        colour1 = colourNW + colourSW >> 1;
        colour2 = colour2NW + colour2SW >> 1;
      } else if (type === 9) {
        x2 = sceneX + HALF_SQUARE;
        z2 = sceneZ + CORNER_SMALL;
        y = heightSW + heightSE >> 1;
        colour1 = colourSW + colourSE >> 1;
        colour2 = colour2SW + colour2SE >> 1;
      } else if (type === 10) {
        x2 = sceneX + CORNER_BIG;
        z2 = sceneZ + HALF_SQUARE;
        y = heightSE + heightNE >> 1;
        colour1 = colourSE + colourNE >> 1;
        colour2 = colour2SE + colour2NE >> 1;
      } else if (type === 11) {
        x2 = sceneX + HALF_SQUARE;
        z2 = sceneZ + CORNER_BIG;
        y = heightNE + heightNW >> 1;
        colour1 = colourNE + colourNW >> 1;
        colour2 = colour2NE + colour2NW >> 1;
      } else if (type === 12) {
        x2 = sceneX + CORNER_SMALL;
        z2 = sceneZ + HALF_SQUARE;
        y = heightNW + heightSW >> 1;
        colour1 = colourNW + colourSW >> 1;
        colour2 = colour2NW + colour2SW >> 1;
      } else if (type === 13) {
        x2 = sceneX + CORNER_SMALL;
        z2 = sceneZ + CORNER_SMALL;
        y = heightSW;
        colour1 = colourSW;
        colour2 = colour2SW;
      } else if (type === 14) {
        x2 = sceneX + CORNER_BIG;
        z2 = sceneZ + CORNER_SMALL;
        y = heightSE;
        colour1 = colourSE;
        colour2 = colour2SE;
      } else if (type === 15) {
        x2 = sceneX + CORNER_BIG;
        z2 = sceneZ + CORNER_BIG;
        y = heightNE;
        colour1 = colourNE;
        colour2 = colour2NE;
      } else {
        x2 = sceneX + CORNER_SMALL;
        z2 = sceneZ + CORNER_BIG;
        y = heightNW;
        colour1 = colourNW;
        colour2 = colour2NW;
      }
      this.vertexX[v] = x2;
      this.vertexY[v] = y;
      this.vertexZ[v] = z2;
      primaryColours[v] = colour1;
      secondaryColours[v] = colour2;
    }
    const paths = defShapeF[shape];
    const faceCount = paths.length / 4 | 0;
    this.faceVertexA = new Int32Array(faceCount);
    this.faceVertexB = new Int32Array(faceCount);
    this.faceVertexC = new Int32Array(faceCount);
    this.faceColourA = new Int32Array(faceCount);
    this.faceColourB = new Int32Array(faceCount);
    this.faceColourC = new Int32Array(faceCount);
    if (texture !== -1) {
      this.faceTexture = new Int32Array(faceCount);
    } else {
      this.faceTexture = null;
    }
    let index = 0;
    for (let t = 0;t < faceCount; t++) {
      const colour = paths[index];
      let a = paths[index + 1];
      let b = paths[index + 2];
      let c = paths[index + 3];
      index += 4;
      if (a < 4) {
        a = a - rotation & 3;
      }
      if (b < 4) {
        b = b - rotation & 3;
      }
      if (c < 4) {
        c = c - rotation & 3;
      }
      this.faceVertexA[t] = a;
      this.faceVertexB[t] = b;
      this.faceVertexC[t] = c;
      if (colour === 0) {
        this.faceColourA[t] = primaryColours[a];
        this.faceColourB[t] = primaryColours[b];
        this.faceColourC[t] = primaryColours[c];
        if (this.faceTexture) {
          this.faceTexture[t] = -1;
        }
      } else {
        this.faceColourA[t] = secondaryColours[a];
        this.faceColourB[t] = secondaryColours[b];
        this.faceColourC[t] = secondaryColours[c];
        if (this.faceTexture) {
          this.faceTexture[t] = texture;
        }
      }
    }
  }
}

// src/dash3d/QuickGround.ts
class QuickGround {
  colourSW;
  colourSE;
  colourNE;
  colourNW;
  texture;
  minimapRgb;
  flat;
  constructor(colourSW, colourSE, colourNE, colourNW, texture, minimapRgb, flat) {
    this.colourSW = colourSW;
    this.colourSE = colourSE;
    this.colourNE = colourNE;
    this.colourNW = colourNW;
    this.texture = texture;
    this.minimapRgb = minimapRgb;
    this.flat = flat;
  }
}

// src/dash3d/Wall.ts
class Wall {
  y;
  x;
  z;
  angle1;
  angle2;
  model1;
  model2;
  typecode;
  typecode2;
  constructor(y, x, z, angle1, angle2, model1, model2, typecode, typecode2) {
    this.y = y;
    this.x = x;
    this.z = z;
    this.angle1 = angle1;
    this.angle2 = angle2;
    this.model1 = model1;
    this.model2 = model2;
    this.typecode = typecode;
    this.typecode2 = typecode2;
  }
}

// src/dash3d/Decor.ts
class Decor {
  y;
  x;
  z;
  wshape;
  angle;
  model;
  typecode;
  typecode2;
  constructor(y, x, z, wshape, angle, model, typecode, info) {
    this.y = y;
    this.x = x;
    this.z = z;
    this.wshape = wshape;
    this.angle = angle;
    this.model = model;
    this.typecode = typecode;
    this.typecode2 = info;
  }
}

// src/dash3d/World.ts
var PRETAB = Uint8Array.of(19, 55, 38, 155, 255, 110, 137, 205, 76);
var MIDTAB = Uint8Array.of(160, 192, 80, 96, 0, 144, 80, 48, 160);
var POSTTAB = Uint8Array.of(76, 8, 137, 4, 0, 1, 38, 2, 19);
var MIDDEP_16 = Uint8Array.of(0, 0, 2, 0, 0, 2, 1, 1, 0);
var MIDDEP_32 = Uint8Array.of(2, 0, 0, 2, 0, 0, 0, 4, 4);
var MIDDEP_64 = Uint8Array.of(0, 4, 4, 8, 0, 0, 8, 0, 0);
var MIDDEP_128 = Uint8Array.of(1, 1, 0, 0, 0, 8, 0, 0, 8);
var DECORXOF = Int8Array.of(53, -53, -53, 53);
var DECORZOF = Int8Array.of(-53, -53, 53, 53);
var DECORXOF2 = Int8Array.of(-45, 45, 45, -45);
var DECORZOF2 = Int8Array.of(45, 45, -45, -45);
var MINIMAP_SHAPE = [
  new Uint8Array(16),
  Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
  Uint8Array.of(1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1),
  Uint8Array.of(1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0),
  Uint8Array.of(0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1),
  Uint8Array.of(0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
  Uint8Array.of(1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1),
  Uint8Array.of(1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0),
  Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0),
  Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1),
  Uint8Array.of(1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0),
  Uint8Array.of(0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1),
  Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1)
];
var MINIMAP_ROTATE = [
  Uint8Array.of(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15),
  Uint8Array.of(12, 8, 4, 0, 13, 9, 5, 1, 14, 10, 6, 2, 15, 11, 7, 3),
  Uint8Array.of(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0),
  Uint8Array.of(3, 7, 11, 15, 2, 6, 10, 14, 1, 5, 9, 13, 0, 4, 8, 12)
];
var TEXTURE_AVERAGE = Uint16Array.of(41, 39248, 41, 4643, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 43086, 41, 41, 41, 41, 41, 41, 41, 8602, 41, 28992, 41, 41, 41, 41, 41, 5056, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 3131, 41, 41, 41);

class World {
  static lowMem = true;
  static cameraSinX = 0;
  static cameraCosX = 0;
  static cameraSinY = 0;
  static cameraCosY = 0;
  static fillLeft = 0;
  static fillQueue = new LinkList;
  static maxLevel = 0;
  static cycleNo = 0;
  static minX = 0;
  static maxX = 0;
  static minZ = 0;
  static maxZ = 0;
  static gx = 0;
  static gz = 0;
  static cx = 0;
  static cy = 0;
  static cz = 0;
  static click = false;
  static clickX = 0;
  static clickY = 0;
  static groundX = -1;
  static groundZ = -1;
  static visBacking = new TypedArray4d(8, 32, 51, 51, false);
  static visBackingDirty = null;
  static numActiveOccluders = 0;
  static activeOccluders = new TypedArray1d(500, null);
  static numOccluders = new Int32Array(4 /* LEVELS */);
  static occluders = new TypedArray2d(4 /* LEVELS */, 500, null);
  static spriteBuffer = new TypedArray1d(100, null);
  static xClip = 0;
  static yClip = 0;
  static xClip2 = 0;
  static yClip2 = 0;
  static xOrig = 0;
  static yOrig = 0;
  minLevel = 0;
  maxTileLevel;
  maxTileX;
  maxTileZ;
  groundh;
  squares;
  occlusionCycle;
  dynamicCount = 0;
  dynamicSprites = new TypedArray1d(5000, null);
  shareTic = 0;
  shareMap = new Int32Array(1e4);
  shareMap2 = new Int32Array(1e4);
  constructor(levelHeightmaps, maxTileZ, maxLevel, maxTileX) {
    this.maxTileLevel = maxLevel;
    this.maxTileX = maxTileX;
    this.maxTileZ = maxTileZ;
    this.squares = new TypedArray3d(maxLevel, maxTileX, maxTileZ, null);
    this.occlusionCycle = new Int32Array3d(maxLevel, maxTileX + 1, maxTileZ + 1);
    this.groundh = levelHeightmaps;
    this.resetMap();
  }
  resetMap() {
    for (let level = 0;level < this.maxTileLevel; level++) {
      for (let x = 0;x < this.maxTileX; x++) {
        for (let z = 0;z < this.maxTileZ; z++) {
          this.squares[level][x][z] = null;
        }
      }
    }
    for (let l = 0;l < 4 /* LEVELS */; l++) {
      for (let o = 0;o < World.numOccluders[l]; o++) {
        World.occluders[l][o] = null;
      }
      World.numOccluders[l] = 0;
    }
    for (let i = 0;i < this.dynamicCount; i++) {
      this.dynamicSprites[i] = null;
    }
    this.dynamicCount = 0;
    World.spriteBuffer.fill(null);
  }
  fillBaseLevel(level) {
    this.minLevel = level;
    for (let stx = 0;stx < this.maxTileX; stx++) {
      for (let stz = 0;stz < this.maxTileZ; stz++) {
        this.squares[level][stx][stz] = new Square(level, stx, stz);
      }
    }
  }
  pushDown(stx, stz) {
    const below = this.squares[0][stx][stz];
    for (let level = 0;level < 3; level++) {
      this.squares[level][stx][stz] = this.squares[level + 1][stx][stz];
      const tile2 = this.squares[level][stx][stz];
      if (tile2) {
        tile2.level--;
      }
    }
    if (!this.squares[0][stx][stz]) {
      this.squares[0][stx][stz] = new Square(0, stx, stz);
    }
    const tile = this.squares[0][stx][stz];
    if (tile) {
      tile.linkedSquare = below;
    }
    this.squares[3][stx][stz] = null;
  }
  static setOcclude(level, type, minX, minY, minZ, maxX, maxY, maxZ) {
    World.occluders[level][World.numOccluders[level]++] = new Occlude(minX / 128 | 0, maxX / 128 | 0, minZ / 128 | 0, maxZ / 128 | 0, type, minX, maxX, minZ, maxZ, minY, maxY);
  }
  setLayer(level, stx, stz, drawLevel) {
    const tile = this.squares[level][stx][stz];
    if (!tile) {
      return;
    }
    tile.drawLevel = drawLevel;
  }
  setGround(level, x, z, shape, rotation, texture, heightSW, heightSE, heightNE, heightNW, colourSW, colourSE, colourNE, colourNW, colour2SW, colour2SE, colour2NE, colour2NW, overlay, underlay) {
    if (shape === 0 /* PLAIN */) {
      for (let l = level;l >= 0; l--) {
        if (!this.squares[l][x][z]) {
          this.squares[l][x][z] = new Square(l, x, z);
        }
      }
      const tile = this.squares[level][x][z];
      if (tile) {
        tile.quickGround = new QuickGround(colourSW, colourSE, colourNE, colourNW, -1, overlay, false);
      }
    } else if (shape === 1 /* DIAGONAL */) {
      for (let l = level;l >= 0; l--) {
        if (!this.squares[l][x][z]) {
          this.squares[l][x][z] = new Square(l, x, z);
        }
      }
      const tile = this.squares[level][x][z];
      if (tile) {
        tile.quickGround = new QuickGround(colour2SW, colour2SE, colour2NE, colour2NW, texture, underlay, heightSW === heightSE && heightSW === heightNE && heightSW === heightNW);
      }
    } else {
      for (let l = level;l >= 0; l--) {
        if (!this.squares[l][x][z]) {
          this.squares[l][x][z] = new Square(l, x, z);
        }
      }
      const tile = this.squares[level][x][z];
      if (tile) {
        tile.ground = new Ground(x, shape, colour2SE, heightSE, colourNE, rotation, colourSW, heightNW, underlay, colour2SW, texture, colour2NW, overlay, heightNE, colour2NE, colourNW, heightSW, z, colourSE);
      }
    }
  }
  setGroundDecor(model, tileLevel, tileX, tileZ, y, typecode, typecode2) {
    if (!this.squares[tileLevel][tileX][tileZ]) {
      this.squares[tileLevel][tileX][tileZ] = new Square(tileLevel, tileX, tileZ);
    }
    const tile = this.squares[tileLevel][tileX][tileZ];
    if (tile) {
      tile.groundDecor = new GroundDecor(y, tileX * 128 + 64, tileZ * 128 + 64, model, typecode, typecode2);
    }
  }
  delGroundDecor(level, x, z) {
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    tile.groundDecor = null;
  }
  setObj(stx, stz, y, level, typecode, topObj, middleObj, bottomObj) {
    let stackOffset = 0;
    const tile = this.squares[level][stx][stz];
    if (tile) {
      for (let l = 0;l < tile.spriteCount; l++) {
        const sprite = tile.sprites[l];
        if (!sprite || !sprite.model) {
          continue;
        }
        const height = sprite.model.objRaise;
        if (height > stackOffset) {
          stackOffset = height;
        }
      }
    } else {
      this.squares[level][stx][stz] = new Square(level, stx, stz);
    }
    const tile2 = this.squares[level][stx][stz];
    if (tile2) {
      tile2.groundObject = new GroundObject(y, stx * 128 + 64, stz * 128 + 64, topObj, middleObj, bottomObj, typecode, stackOffset);
    }
  }
  delObj(level, x, z) {
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    tile.groundObject = null;
  }
  setWall(level, tileX, tileZ, y, angle1, angle2, model1, model2, typecode1, typecode2) {
    if (!model1 && !model2) {
      return;
    }
    for (let l = level;l >= 0; l--) {
      if (!this.squares[l][tileX][tileZ]) {
        this.squares[l][tileX][tileZ] = new Square(l, tileX, tileZ);
      }
    }
    const tile = this.squares[level][tileX][tileZ];
    if (tile) {
      tile.wall = new Wall(y, tileX * 128 + 64, tileZ * 128 + 64, angle1, angle2, model1, model2, typecode1, typecode2);
    }
  }
  delWall(level, x, z) {
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    tile.wall = null;
  }
  setDecor(level, tileX, tileZ, y, offsetX, offsetZ, typecode, model, info, angle, type) {
    if (!model) {
      return;
    }
    for (let l = level;l >= 0; l--) {
      if (!this.squares[l][tileX][tileZ]) {
        this.squares[l][tileX][tileZ] = new Square(l, tileX, tileZ);
      }
    }
    const tile = this.squares[level][tileX][tileZ];
    if (tile) {
      tile.decor = new Decor(y, tileX * 128 + offsetX + 64, tileZ * 128 + offsetZ + 64, type, angle, model, typecode, info);
    }
  }
  delDecor(level, x, z) {
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    tile.decor = null;
  }
  moveDecor(level, x, z, offset) {
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    const decor = tile.decor;
    if (!decor) {
      return;
    }
    const sx = x * 128 + 64;
    const sz = z * 128 + 64;
    decor.x = sx + ((decor.x - sx) * offset / 16 | 0);
    decor.z = sz + ((decor.z - sz) * offset / 16 | 0);
  }
  setWallDecorationModel(level, x, z, model) {
    if (!model) {
      return;
    }
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    const decor = tile.decor;
    if (!decor) {
      return;
    }
    decor.model = model;
  }
  setGroundDecorationModel(level, x, z, model) {
    if (!model) {
      return;
    }
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    const decor = tile.groundDecor;
    if (!decor) {
      return;
    }
    decor.model = model;
  }
  setWallModel(level, x, z, model) {
    if (!model) {
      return;
    }
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    const wall = tile.wall;
    if (!wall) {
      return;
    }
    wall.model1 = model;
  }
  setWallModels(x, z, level, modelA, modelB) {
    if (!modelA) {
      return;
    }
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    const wall = tile.wall;
    if (!wall) {
      return;
    }
    wall.model1 = modelA;
    wall.model2 = modelB;
  }
  addScenery(level, tileX, tileZ, y, model, entity, typecode, info, width, length, yaw) {
    if (!model && !entity) {
      return true;
    }
    const sceneX = tileX * 128 + width * 64;
    const sceneZ = tileZ * 128 + length * 64;
    return this.setSprite(sceneX, sceneZ, y, level, tileX, tileZ, width, length, model, entity, typecode, info, yaw, false);
  }
  addDynamic(level, x, y, z, model, entity, typecode, yaw, padding, forwardPadding) {
    if (!model && !entity) {
      return true;
    }
    let x0 = x - padding;
    let z0 = z - padding;
    let x1 = x + padding;
    let z1 = z + padding;
    if (forwardPadding) {
      if (yaw > 640 && yaw < 1408) {
        z1 += 128;
      }
      if (yaw > 1152 && yaw < 1920) {
        x1 += 128;
      }
      if (yaw > 1664 || yaw < 384) {
        z0 -= 128;
      }
      if (yaw > 128 && yaw < 896) {
        x0 -= 128;
      }
    }
    x0 = x0 / 128 | 0;
    z0 = z0 / 128 | 0;
    x1 = x1 / 128 | 0;
    z1 = z1 / 128 | 0;
    return this.setSprite(x, z, y, level, x0, z0, x1 + 1 - x0, z1 - z0 + 1, model, entity, typecode, 0, yaw, true);
  }
  addDynamic2(level, x, y, z, minTileX, minTileZ, maxTileX, maxTileZ, model, entity, typecode, yaw) {
    return !model && !entity || this.setSprite(x, z, y, level, minTileX, minTileZ, maxTileX + 1 - minTileX, maxTileZ - minTileZ + 1, model, entity, typecode, 0, yaw, true);
  }
  delLoc(level, x, z) {
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    for (let l = 0;l < tile.spriteCount; l++) {
      const loc = tile.sprites[l];
      if (loc && (loc.typecode >> 29 & 3) === 2 && loc.minTileX === x && loc.minTileZ === z) {
        this.delSprite(loc);
        return;
      }
    }
  }
  setLocModel(level, x, z, model) {
    if (!model) {
      return;
    }
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    for (let l = 0;l < tile.spriteCount; l++) {
      const sprite = tile.sprites[l];
      if (sprite && (sprite.typecode >> 29 & 3) === 2) {
        sprite.model = model;
        return;
      }
    }
  }
  removeSprites() {
    for (let i = 0;i < this.dynamicCount; i++) {
      const loc = this.dynamicSprites[i];
      if (loc) {
        this.delSprite(loc);
      }
      this.dynamicSprites[i] = null;
    }
    this.dynamicCount = 0;
  }
  squareAt(level, x, z) {
    if (level < 0 || level >= this.maxTileLevel || x < 0 || z < 0 || x >= this.maxTileX || z >= this.maxTileZ) {
      return null;
    }
    return this.squares[level][x][z];
  }
  wallType(level, x, z) {
    const tile = this.squares[level][x][z];
    return !tile || !tile.wall ? 0 : tile.wall.typecode;
  }
  decorType(level, z, x) {
    const tile = this.squares[level][x][z];
    return !tile || !tile.decor ? 0 : tile.decor.typecode;
  }
  sceneType(level, x, z) {
    const tile = this.squares[level][x][z];
    if (!tile) {
      return 0;
    }
    for (let l = 0;l < tile.spriteCount; l++) {
      const sprite = tile.sprites[l];
      if (sprite && (sprite.typecode >> 29 & 3) === 2 && sprite.minTileX === x && sprite.minTileZ === z) {
        return sprite.typecode;
      }
    }
    return 0;
  }
  gdType(level, x, z) {
    const tile = this.squares[level][x][z];
    return !tile || !tile.groundDecor ? 0 : tile.groundDecor.typecode;
  }
  typeCode2(level, x, z, typecode) {
    const tile = this.squares[level][x][z];
    if (!tile) {
      return -1;
    } else if (tile.wall && tile.wall.typecode === typecode) {
      return tile.wall.typecode2 & 255;
    } else if (tile.decor && tile.decor.typecode === typecode) {
      return tile.decor.typecode2 & 255;
    } else if (tile.groundDecor && tile.groundDecor.typecode === typecode) {
      return tile.groundDecor.typecode2 & 255;
    } else {
      for (let i = 0;i < tile.spriteCount; i++) {
        const sprite = tile.sprites[i];
        if (sprite && sprite.typecode === typecode) {
          return sprite.typecode2 & 255;
        }
      }
      return -1;
    }
  }
  shareLight(ambient, contrast, lightSrcX, lightSrcY, lightSrcZ) {
    const lightMagnitude = Math.sqrt(lightSrcX * lightSrcX + lightSrcY * lightSrcY + lightSrcZ * lightSrcZ) | 0;
    const attenuation = contrast * lightMagnitude >> 8;
    for (let level = 0;level < this.maxTileLevel; level++) {
      for (let tileX = 0;tileX < this.maxTileX; tileX++) {
        for (let tileZ = 0;tileZ < this.maxTileZ; tileZ++) {
          const tile = this.squares[level][tileX][tileZ];
          if (!tile) {
            continue;
          }
          const wall = tile.wall;
          if (wall && wall.model1 && wall.model1.pointNormal) {
            this.shareLightLoc(level, tileX, tileZ, 1, 1, wall.model1);
            if (wall.model2 && wall.model2.pointNormal) {
              this.shareLightLoc(level, tileX, tileZ, 1, 1, wall.model2);
              this.modelShareLight(wall.model1, wall.model2, 0, 0, 0, false);
              wall.model2.light(ambient, attenuation, lightSrcX, lightSrcY, lightSrcZ);
            }
            wall.model1.light(ambient, attenuation, lightSrcX, lightSrcY, lightSrcZ);
          }
          for (let i = 0;i < tile.spriteCount; i++) {
            const sprite = tile.sprites[i];
            if (sprite && sprite.model && sprite.model.pointNormal) {
              this.shareLightLoc(level, tileX, tileZ, sprite.maxTileX + 1 - sprite.minTileX, sprite.maxTileZ - sprite.minTileZ + 1, sprite.model);
              sprite.model.light(ambient, attenuation, lightSrcX, lightSrcY, lightSrcZ);
            }
          }
          const decor = tile.groundDecor;
          if (decor && decor.model && decor.model.pointNormal) {
            this.shareLightGd(level, tileX, tileZ, decor.model);
            decor.model.light(ambient, attenuation, lightSrcX, lightSrcY, lightSrcZ);
          }
        }
      }
    }
  }
  shareLightGd(level, tileX, tileZ, model) {
    if (tileX < this.maxTileX) {
      const tile = this.squares[level][tileX + 1][tileZ];
      if (tile && tile.groundDecor && tile.groundDecor.model && tile.groundDecor.model.pointNormal) {
        this.modelShareLight(model, tile.groundDecor.model, 128, 0, 0, true);
      }
    }
    if (tileZ < this.maxTileX) {
      const tile = this.squares[level][tileX][tileZ + 1];
      if (tile && tile.groundDecor && tile.groundDecor.model && tile.groundDecor.model.pointNormal) {
        this.modelShareLight(model, tile.groundDecor.model, 0, 0, 128, true);
      }
    }
    if (tileX < this.maxTileX && tileZ < this.maxTileZ) {
      const tile = this.squares[level][tileX + 1][tileZ + 1];
      if (tile && tile.groundDecor && tile.groundDecor.model && tile.groundDecor.model.pointNormal) {
        this.modelShareLight(model, tile.groundDecor.model, 128, 0, 128, true);
      }
    }
    if (tileX < this.maxTileX && tileZ > 0) {
      const tile = this.squares[level][tileX + 1][tileZ - 1];
      if (tile && tile.groundDecor && tile.groundDecor.model && tile.groundDecor.model.pointNormal) {
        this.modelShareLight(model, tile.groundDecor.model, 128, 0, -128, true);
      }
    }
  }
  shareLightLoc(level, tileX, tileZ, tileSizeX, tileSizeZ, model) {
    let allowFaceRemoval = true;
    let minTileX = tileX;
    const maxTileX = tileX + tileSizeX;
    const minTileZ = tileZ - 1;
    const maxTileZ = tileZ + tileSizeZ;
    for (let l = level;l <= level + 1; l++) {
      if (l === this.maxTileLevel) {
        continue;
      }
      for (let x = minTileX;x <= maxTileX; x++) {
        if (x < 0 || x >= this.maxTileX) {
          continue;
        }
        for (let z = minTileZ;z <= maxTileZ; z++) {
          if (z < 0 || z >= this.maxTileZ || allowFaceRemoval && x < maxTileX && z < maxTileZ && (z >= tileZ || x === tileX)) {
            continue;
          }
          const tile = this.squares[l][x][z];
          if (!tile) {
            continue;
          }
          const offsetX = (x - tileX) * 128 + (1 - tileSizeX) * 64;
          const offsetZ = (z - tileZ) * 128 + (1 - tileSizeZ) * 64;
          const offsetY = ((this.groundh[l][x][z] + this.groundh[l][x + 1][z] + this.groundh[l][x][z + 1] + this.groundh[l][x + 1][z + 1]) / 4 | 0) - ((this.groundh[level][tileX][tileZ] + this.groundh[level][tileX + 1][tileZ] + this.groundh[level][tileX][tileZ + 1] + this.groundh[level][tileX + 1][tileZ + 1]) / 4 | 0);
          const wall = tile.wall;
          if (wall && wall.model1 && wall.model1.pointNormal) {
            this.modelShareLight(model, wall.model1, offsetX, offsetY, offsetZ, allowFaceRemoval);
          }
          if (wall && wall.model2 && wall.model2.pointNormal) {
            this.modelShareLight(model, wall.model2, offsetX, offsetY, offsetZ, allowFaceRemoval);
          }
          for (let i = 0;i < tile.spriteCount; i++) {
            const sprite = tile.sprites[i];
            if (!sprite || !sprite.model || !sprite.model.pointNormal) {
              continue;
            }
            const sizeX = sprite.maxTileX + 1 - sprite.minTileX;
            const sizeZ = sprite.maxTileZ + 1 - sprite.minTileZ;
            this.modelShareLight(model, sprite.model, (sprite.minTileX - tileX) * 128 + (sizeX - tileSizeX) * 64, offsetY, (sprite.minTileZ - tileZ) * 128 + (sizeZ - tileSizeZ) * 64, allowFaceRemoval);
          }
        }
      }
      minTileX--;
      allowFaceRemoval = false;
    }
  }
  modelShareLight(modelA, modelB, offsetX, offsetY, offsetZ, allowFaceRemoval) {
    this.shareTic++;
    let merged = 0;
    const vertexX = modelB.pointX;
    const vertexCountB = modelB.numPoints;
    if (modelA.pointNormal && modelA.sharedPointNormal) {
      for (let vertexA = 0;vertexA < modelA.numPoints; vertexA++) {
        const normalA = modelA.pointNormal[vertexA];
        const originalNormalA = modelA.sharedPointNormal[vertexA];
        if (originalNormalA && originalNormalA.w !== 0) {
          const y = modelA.pointY[vertexA] - offsetY;
          if (y > modelB.maxY) {
            continue;
          }
          const x = modelA.pointX[vertexA] - offsetX;
          if (x < modelB.minX || x > modelB.maxX) {
            continue;
          }
          const z = modelA.pointZ[vertexA] - offsetZ;
          if (z < modelB.minZ || z > modelB.maxZ) {
            continue;
          }
          if (modelB.pointNormal && modelB.sharedPointNormal) {
            for (let vertexB = 0;vertexB < vertexCountB; vertexB++) {
              const normalB = modelB.pointNormal[vertexB];
              const originalNormalB = modelB.sharedPointNormal[vertexB];
              if (x !== vertexX[vertexB] || z !== modelB.pointZ[vertexB] || y !== modelB.pointY[vertexB] || originalNormalB && originalNormalB.w === 0) {
                continue;
              }
              if (normalA && normalB && originalNormalB) {
                normalA.x += originalNormalB.x;
                normalA.y += originalNormalB.y;
                normalA.z += originalNormalB.z;
                normalA.w += originalNormalB.w;
                normalB.x += originalNormalA.x;
                normalB.y += originalNormalA.y;
                normalB.z += originalNormalA.z;
                normalB.w += originalNormalA.w;
                merged++;
              }
              this.shareMap[vertexA] = this.shareTic;
              this.shareMap2[vertexB] = this.shareTic;
            }
          }
        }
      }
    }
    if (merged < 3 || !allowFaceRemoval) {
      return;
    }
    if (modelA.faceRenderType) {
      for (let i = 0;i < modelA.numFaces; i++) {
        if (this.shareMap[modelA.faceVertexA[i]] === this.shareTic && this.shareMap[modelA.faceVertexB[i]] === this.shareTic && this.shareMap[modelA.faceVertexC[i]] === this.shareTic) {
          modelA.faceRenderType[i] = -1;
        }
      }
    }
    if (modelB.faceRenderType) {
      for (let i = 0;i < modelB.numFaces; i++) {
        if (this.shareMap2[modelB.faceVertexA[i]] === this.shareTic && this.shareMap2[modelB.faceVertexB[i]] === this.shareTic && this.shareMap2[modelB.faceVertexC[i]] === this.shareTic) {
          modelB.faceRenderType[i] = -1;
        }
      }
    }
  }
  render2DGround(level, x, z, dst, offset, step) {
    const tile = this.squares[level][x][z];
    if (!tile) {
      return;
    }
    const quickGround = tile.quickGround;
    if (quickGround) {
      const rgb = quickGround.minimapRgb;
      if (rgb !== 0) {
        for (let i = 0;i < 4; i++) {
          dst[offset] = rgb;
          dst[offset + 1] = rgb;
          dst[offset + 2] = rgb;
          dst[offset + 3] = rgb;
          offset += step;
        }
      }
      return;
    }
    const ground = tile.ground;
    if (ground) {
      const shape = ground.overlayShape;
      const rotation = ground.overlayRotation;
      const overlay = ground.minimapOverlay;
      const underlay = ground.minimapUnderlay;
      const minimapShape = MINIMAP_SHAPE[shape];
      const minimapRotation = MINIMAP_ROTATE[rotation];
      let off = 0;
      if (overlay !== 0) {
        for (let i = 0;i < 4; i++) {
          dst[offset] = minimapShape[minimapRotation[off++]] === 0 ? overlay : underlay;
          dst[offset + 1] = minimapShape[minimapRotation[off++]] === 0 ? overlay : underlay;
          dst[offset + 2] = minimapShape[minimapRotation[off++]] === 0 ? overlay : underlay;
          dst[offset + 3] = minimapShape[minimapRotation[off++]] === 0 ? overlay : underlay;
          offset += step;
        }
        return;
      }
      for (let i = 0;i < 4; i++) {
        if (minimapShape[minimapRotation[off++]] !== 0) {
          dst[offset] = underlay;
        }
        if (minimapShape[minimapRotation[off++]] !== 0) {
          dst[offset + 1] = underlay;
        }
        if (minimapShape[minimapRotation[off++]] !== 0) {
          dst[offset + 2] = underlay;
        }
        if (minimapShape[minimapRotation[off++]] !== 0) {
          dst[offset + 3] = underlay;
        }
        offset += step;
      }
    }
  }
  static resetVisCalc(viewportWidth, viewportHeight, frustumStart, frustumEnd, pitchDistance) {
    this.xClip = 0;
    this.yClip = 0;
    this.xClip2 = viewportWidth;
    this.yClip2 = viewportHeight;
    this.xOrig = viewportWidth / 2 | 0;
    this.yOrig = viewportHeight / 2 | 0;
    const visBacking = new TypedArray4d(9, 32, 53, 53, false);
    for (let pitch = 128;pitch <= 384; pitch += 32) {
      for (let yaw = 0;yaw < 2048; yaw += 64) {
        this.cameraSinX = Pix3D.sinTable[pitch];
        this.cameraCosX = Pix3D.cosTable[pitch];
        this.cameraSinY = Pix3D.sinTable[yaw];
        this.cameraCosY = Pix3D.cosTable[yaw];
        const pitchLevel = (pitch - 128) / 32 | 0;
        const yawLevel = yaw / 64 | 0;
        for (let dx = -26;dx <= 26; dx++) {
          for (let dz = -26;dz <= 26; dz++) {
            const x = dx * 128;
            const z = dz * 128;
            let visible = false;
            for (let y = -frustumStart;y <= frustumEnd; y += 128) {
              if (this.testPoint(x, z, pitchDistance[pitchLevel] + y)) {
                visible = true;
                break;
              }
            }
            visBacking[pitchLevel][yawLevel][dx + 25 + 1][dz + 25 + 1] = visible;
          }
        }
      }
    }
    for (let pitchLevel = 0;pitchLevel < 8; pitchLevel++) {
      for (let yawLevel = 0;yawLevel < 32; yawLevel++) {
        for (let x = -25;x < 25; x++) {
          for (let z = -25;z < 25; z++) {
            let visible = false;
            check_areas:
              for (let dx = -1;dx <= 1; dx++) {
                for (let dz = -1;dz <= 1; dz++) {
                  if (visBacking[pitchLevel][yawLevel][x + dx + 25 + 1][z + dz + 25 + 1]) {
                    visible = true;
                    break check_areas;
                  }
                  if (visBacking[pitchLevel][(yawLevel + 1) % 31][x + dx + 25 + 1][z + dz + 25 + 1]) {
                    visible = true;
                    break check_areas;
                  }
                  if (visBacking[pitchLevel + 1][yawLevel][x + dx + 25 + 1][z + dz + 25 + 1]) {
                    visible = true;
                    break check_areas;
                  }
                  if (visBacking[pitchLevel + 1][(yawLevel + 1) % 31][x + dx + 25 + 1][z + dz + 25 + 1]) {
                    visible = true;
                    break check_areas;
                  }
                }
              }
            this.visBacking[pitchLevel][yawLevel][x + 25][z + 25] = visible;
          }
        }
      }
    }
  }
  static testPoint(x, z, y) {
    const px = z * this.cameraSinY + x * this.cameraCosY >> 16;
    const tmp = z * this.cameraCosY - x * this.cameraSinY >> 16;
    const pz = y * this.cameraSinX + tmp * this.cameraCosX >> 16;
    const py = y * this.cameraCosX - tmp * this.cameraSinX >> 16;
    if (pz < 50 || pz > 3500) {
      return false;
    }
    const viewportX = this.xOrig + ((px << 9) / pz | 0);
    const viewportY = this.yOrig + ((py << 9) / pz | 0);
    return viewportX >= this.xClip && viewportX <= this.xClip2 && viewportY >= this.yClip && viewportY <= this.yClip2;
  }
  updateMousePicking(mouseX, mouseY) {
    World.click = true;
    World.clickX = mouseX;
    World.clickY = mouseY;
    World.groundX = -1;
    World.groundZ = -1;
  }
  renderAll(eyeX, eyeY, eyeZ, maxLevel, eyeYaw, eyePitch, loopCycle) {
    if (eyeX < 0) {
      eyeX = 0;
    } else if (eyeX >= this.maxTileX * 128) {
      eyeX = this.maxTileX * 128 - 1;
    }
    if (eyeZ < 0) {
      eyeZ = 0;
    } else if (eyeZ >= this.maxTileZ * 128) {
      eyeZ = this.maxTileZ * 128 - 1;
    }
    World.cycleNo++;
    World.cameraSinX = Pix3D.sinTable[eyePitch];
    World.cameraCosX = Pix3D.cosTable[eyePitch];
    World.cameraSinY = Pix3D.sinTable[eyeYaw];
    World.cameraCosY = Pix3D.cosTable[eyeYaw];
    World.visBackingDirty = World.visBacking[(eyePitch - 128) / 32 | 0][eyeYaw / 64 | 0];
    World.cx = eyeX;
    World.cy = eyeY;
    World.cz = eyeZ;
    World.gx = eyeX / 128 | 0;
    World.gz = eyeZ / 128 | 0;
    World.maxLevel = maxLevel;
    World.minX = World.gx - 25;
    if (World.minX < 0) {
      World.minX = 0;
    }
    World.minZ = World.gz - 25;
    if (World.minZ < 0) {
      World.minZ = 0;
    }
    World.maxX = World.gx + 25;
    if (World.maxX > this.maxTileX) {
      World.maxX = this.maxTileX;
    }
    World.maxZ = World.gz + 25;
    if (World.maxZ > this.maxTileZ) {
      World.maxZ = this.maxTileZ;
    }
    this.calcOcclude();
    World.fillLeft = 0;
    for (let level = this.minLevel;level < this.maxTileLevel; level++) {
      const tiles = this.squares[level];
      for (let x = World.minX;x < World.maxX; x++) {
        for (let z = World.minZ;z < World.maxZ; z++) {
          const tile = tiles[x][z];
          if (!tile) {
            continue;
          }
          if (tile.drawLevel <= maxLevel && (World.visBackingDirty[x + 25 - World.gx][z + 25 - World.gz] || this.groundh[level][x][z] - eyeY >= 2000)) {
            tile.drawFront = true;
            tile.drawBack = true;
            tile.drawSprites = tile.spriteCount > 0;
            World.fillLeft++;
          } else {
            tile.drawFront = false;
            tile.drawBack = false;
            tile.cornerSides = 0;
          }
        }
      }
    }
    for (let level = this.minLevel;level < this.maxTileLevel; level++) {
      const tiles = this.squares[level];
      for (let dx = -25;dx <= 0; dx++) {
        const rightTileX = World.gx + dx;
        const leftTileX = World.gx - dx;
        if (rightTileX < World.minX && leftTileX >= World.maxX) {
          continue;
        }
        for (let dz = -25;dz <= 0; dz++) {
          const forwardTileZ = World.gz + dz;
          const backwardTileZ = World.gz - dz;
          let tile;
          if (rightTileX >= World.minX) {
            if (forwardTileZ >= World.minZ) {
              tile = tiles[rightTileX][forwardTileZ];
              if (tile && tile.drawFront) {
                this.fill(tile, true, loopCycle);
              }
            }
            if (backwardTileZ < World.maxZ) {
              tile = tiles[rightTileX][backwardTileZ];
              if (tile && tile.drawFront) {
                this.fill(tile, true, loopCycle);
              }
            }
          }
          if (leftTileX < World.maxX) {
            if (forwardTileZ >= World.minZ) {
              tile = tiles[leftTileX][forwardTileZ];
              if (tile && tile.drawFront) {
                this.fill(tile, true, loopCycle);
              }
            }
            if (backwardTileZ < World.maxZ) {
              tile = tiles[leftTileX][backwardTileZ];
              if (tile && tile.drawFront) {
                this.fill(tile, true, loopCycle);
              }
            }
          }
          if (World.fillLeft === 0) {
            World.click = false;
            return;
          }
        }
      }
    }
    for (let level = this.minLevel;level < this.maxTileLevel; level++) {
      const tiles = this.squares[level];
      for (let dx = -25;dx <= 0; dx++) {
        const rightTileX = World.gx + dx;
        const leftTileX = World.gx - dx;
        if (rightTileX < World.minX && leftTileX >= World.maxX) {
          continue;
        }
        for (let dz = -25;dz <= 0; dz++) {
          const forwardTileZ = World.gz + dz;
          const backgroundTileZ = World.gz - dz;
          let tile;
          if (rightTileX >= World.minX) {
            if (forwardTileZ >= World.minZ) {
              tile = tiles[rightTileX][forwardTileZ];
              if (tile && tile.drawFront) {
                this.fill(tile, false, loopCycle);
              }
            }
            if (backgroundTileZ < World.maxZ) {
              tile = tiles[rightTileX][backgroundTileZ];
              if (tile && tile.drawFront) {
                this.fill(tile, false, loopCycle);
              }
            }
          }
          if (leftTileX < World.maxX) {
            if (forwardTileZ >= World.minZ) {
              tile = tiles[leftTileX][forwardTileZ];
              if (tile && tile.drawFront) {
                this.fill(tile, false, loopCycle);
              }
            }
            if (backgroundTileZ < World.maxZ) {
              tile = tiles[leftTileX][backgroundTileZ];
              if (tile && tile.drawFront) {
                this.fill(tile, false, loopCycle);
              }
            }
          }
          if (World.fillLeft === 0) {
            World.click = false;
            return;
          }
        }
      }
    }
  }
  setSprite(x, z, y, level, tileX, tileZ, tileSizeX, tileSizeZ, model, entity, typecode, info, yaw, dynamic) {
    if (!model && !entity) {
      return false;
    }
    for (let tx = tileX;tx < tileX + tileSizeX; tx++) {
      for (let tz = tileZ;tz < tileZ + tileSizeZ; tz++) {
        if (tx < 0 || tz < 0 || tx >= this.maxTileX || tz >= this.maxTileZ) {
          return false;
        }
        const tile = this.squares[level][tx][tz];
        if (tile && tile.spriteCount >= 5) {
          return false;
        }
      }
    }
    const sprite = new Sprite(level, y, x, z, model, entity, yaw, tileX, tileX + tileSizeX - 1, tileZ, tileZ + tileSizeZ - 1, typecode, info);
    for (let tx = tileX;tx < tileX + tileSizeX; tx++) {
      for (let tz = tileZ;tz < tileZ + tileSizeZ; tz++) {
        let spans = 0;
        if (tx > tileX) {
          spans |= 1;
        }
        if (tx < tileX + tileSizeX - 1) {
          spans += 4;
        }
        if (tz > tileZ) {
          spans += 8;
        }
        if (tz < tileZ + tileSizeZ - 1) {
          spans += 2;
        }
        for (let l = level;l >= 0; l--) {
          if (!this.squares[l][tx][tz]) {
            this.squares[l][tx][tz] = new Square(l, tx, tz);
          }
        }
        const tile = this.squares[level][tx][tz];
        if (tile) {
          tile.sprites[tile.spriteCount] = sprite;
          tile.spriteSpan[tile.spriteCount] = spans;
          tile.spriteSpans |= spans;
          tile.spriteCount++;
        }
      }
    }
    if (dynamic) {
      this.dynamicSprites[this.dynamicCount++] = sprite;
    }
    return true;
  }
  delSprite(sprite) {
    for (let tx = sprite.minTileX;tx <= sprite.maxTileX; tx++) {
      for (let tz = sprite.minTileZ;tz <= sprite.maxTileZ; tz++) {
        const tile = this.squares[sprite.level][tx][tz];
        if (!tile) {
          continue;
        }
        for (let i = 0;i < tile.spriteCount; i++) {
          if (tile.sprites[i] === sprite) {
            tile.spriteCount--;
            for (let j = i;j < tile.spriteCount; j++) {
              tile.sprites[j] = tile.sprites[j + 1];
              tile.spriteSpan[j] = tile.spriteSpan[j + 1];
            }
            tile.sprites[tile.spriteCount] = null;
            break;
          }
        }
        tile.spriteSpans = 0;
        for (let i = 0;i < tile.spriteCount; i++) {
          tile.spriteSpans |= tile.spriteSpan[i];
        }
      }
    }
  }
  calcOcclude() {
    const count = World.numOccluders[World.maxLevel];
    const occluders = World.occluders[World.maxLevel];
    World.numActiveOccluders = 0;
    for (let i = 0;i < count; i++) {
      const occluder = occluders[i];
      if (!occluder) {
        continue;
      }
      let deltaMaxY;
      let deltaMinTileZ;
      let deltaMaxTileZ;
      let deltaMaxTileX;
      if (occluder.type === 1) {
        deltaMaxY = occluder.minTileX + 25 - World.gx;
        if (deltaMaxY >= 0 && deltaMaxY <= 50) {
          deltaMinTileZ = occluder.minTileZ + 25 - World.gz;
          if (deltaMinTileZ < 0) {
            deltaMinTileZ = 0;
          }
          deltaMaxTileZ = occluder.maxTileZ + 25 - World.gz;
          if (deltaMaxTileZ > 50) {
            deltaMaxTileZ = 50;
          }
          let ok = false;
          while (deltaMinTileZ <= deltaMaxTileZ) {
            if (World.visBackingDirty && World.visBackingDirty[deltaMaxY][deltaMinTileZ++]) {
              ok = true;
              break;
            }
          }
          if (ok) {
            deltaMaxTileX = World.cx - occluder.minX;
            if (deltaMaxTileX > 32) {
              occluder.mode = 1;
            } else {
              if (deltaMaxTileX >= -32) {
                continue;
              }
              occluder.mode = 2;
              deltaMaxTileX = -deltaMaxTileX;
            }
            occluder.minDeltaZ = (occluder.minZ - World.cz << 8) / deltaMaxTileX | 0;
            occluder.maxDeltaZ = (occluder.maxZ - World.cz << 8) / deltaMaxTileX | 0;
            occluder.minDeltaY = (occluder.minY - World.cy << 8) / deltaMaxTileX | 0;
            occluder.maxDeltaY = (occluder.maxY - World.cy << 8) / deltaMaxTileX | 0;
            World.activeOccluders[World.numActiveOccluders++] = occluder;
          }
        }
      } else if (occluder.type === 2) {
        deltaMaxY = occluder.minTileZ + 25 - World.gz;
        if (deltaMaxY >= 0 && deltaMaxY <= 50) {
          deltaMinTileZ = occluder.minTileX + 25 - World.gx;
          if (deltaMinTileZ < 0) {
            deltaMinTileZ = 0;
          }
          deltaMaxTileZ = occluder.maxTileX + 25 - World.gx;
          if (deltaMaxTileZ > 50) {
            deltaMaxTileZ = 50;
          }
          let ok = false;
          while (deltaMinTileZ <= deltaMaxTileZ) {
            if (World.visBackingDirty && World.visBackingDirty[deltaMinTileZ++][deltaMaxY]) {
              ok = true;
              break;
            }
          }
          if (ok) {
            deltaMaxTileX = World.cz - occluder.minZ;
            if (deltaMaxTileX > 32) {
              occluder.mode = 3;
            } else {
              if (deltaMaxTileX >= -32) {
                continue;
              }
              occluder.mode = 4;
              deltaMaxTileX = -deltaMaxTileX;
            }
            occluder.minDeltaX = (occluder.minX - World.cx << 8) / deltaMaxTileX | 0;
            occluder.maxDeltaX = (occluder.maxX - World.cx << 8) / deltaMaxTileX | 0;
            occluder.minDeltaY = (occluder.minY - World.cy << 8) / deltaMaxTileX | 0;
            occluder.maxDeltaY = (occluder.maxY - World.cy << 8) / deltaMaxTileX | 0;
            World.activeOccluders[World.numActiveOccluders++] = occluder;
          }
        }
      } else if (occluder.type === 4) {
        deltaMaxY = occluder.minY - World.cy;
        if (deltaMaxY > 128) {
          deltaMinTileZ = occluder.minTileZ + 25 - World.gz;
          if (deltaMinTileZ < 0) {
            deltaMinTileZ = 0;
          }
          deltaMaxTileZ = occluder.maxTileZ + 25 - World.gz;
          if (deltaMaxTileZ > 50) {
            deltaMaxTileZ = 50;
          }
          if (deltaMinTileZ <= deltaMaxTileZ) {
            let deltaMinTileX = occluder.minTileX + 25 - World.gx;
            if (deltaMinTileX < 0) {
              deltaMinTileX = 0;
            }
            deltaMaxTileX = occluder.maxTileX + 25 - World.gx;
            if (deltaMaxTileX > 50) {
              deltaMaxTileX = 50;
            }
            let ok = false;
            find_visible_tile:
              for (let x = deltaMinTileX;x <= deltaMaxTileX; x++) {
                for (let z = deltaMinTileZ;z <= deltaMaxTileZ; z++) {
                  if (World.visBackingDirty && World.visBackingDirty[x][z]) {
                    ok = true;
                    break find_visible_tile;
                  }
                }
              }
            if (ok) {
              occluder.mode = 5;
              occluder.minDeltaX = (occluder.minX - World.cx << 8) / deltaMaxY | 0;
              occluder.maxDeltaX = (occluder.maxX - World.cx << 8) / deltaMaxY | 0;
              occluder.minDeltaZ = (occluder.minZ - World.cz << 8) / deltaMaxY | 0;
              occluder.maxDeltaZ = (occluder.maxZ - World.cz << 8) / deltaMaxY | 0;
              World.activeOccluders[World.numActiveOccluders++] = occluder;
            }
          }
        }
      }
    }
  }
  fill(next, checkAdjacent, loopCycle) {
    World.fillQueue.push(next);
    while (true) {
      let tile;
      do {
        tile = World.fillQueue.popFront();
        if (!tile) {
          return;
        }
      } while (!tile.drawBack);
      const tileX = tile.x;
      const tileZ = tile.z;
      const level = tile.level;
      const originalLevel = tile.originalLevel;
      const tiles = this.squares[level];
      if (tile.drawFront) {
        if (checkAdjacent) {
          if (level > 0) {
            const above = this.squares[level - 1][tileX][tileZ];
            if (above && above.drawBack) {
              continue;
            }
          }
          if (tileX <= World.gx && tileX > World.minX) {
            const adjacent = tiles[tileX - 1][tileZ];
            if (adjacent && adjacent.drawBack && (adjacent.drawFront || (tile.spriteSpans & 1) === 0)) {
              continue;
            }
          }
          if (tileX >= World.gx && tileX < World.maxX - 1) {
            const adjacent = tiles[tileX + 1][tileZ];
            if (adjacent && adjacent.drawBack && (adjacent.drawFront || (tile.spriteSpans & 4) === 0)) {
              continue;
            }
          }
          if (tileZ <= World.gz && tileZ > World.minZ) {
            const adjacent = tiles[tileX][tileZ - 1];
            if (adjacent && adjacent.drawBack && (adjacent.drawFront || (tile.spriteSpans & 8) === 0)) {
              continue;
            }
          }
          if (tileZ >= World.gz && tileZ < World.maxZ - 1) {
            const adjacent = tiles[tileX][tileZ + 1];
            if (adjacent && adjacent.drawBack && (adjacent.drawFront || (tile.spriteSpans & 2) === 0)) {
              continue;
            }
          }
        } else {
          checkAdjacent = true;
        }
        tile.drawFront = false;
        if (tile.linkedSquare) {
          const linkedSquare = tile.linkedSquare;
          if (!linkedSquare.quickGround) {
            if (linkedSquare.ground && !this.groundOccluded(0, tileX, tileZ)) {
              this.renderGround(tileX, tileZ, linkedSquare.ground, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY);
            }
          } else if (!this.groundOccluded(0, tileX, tileZ)) {
            this.renderQuickGround(linkedSquare.quickGround, 0, tileX, tileZ, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY);
          }
          const wall2 = linkedSquare.wall;
          if (wall2) {
            wall2.model1?.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, wall2.x - World.cx, wall2.y - World.cy, wall2.z - World.cz, wall2.typecode);
          }
          for (let i = 0;i < linkedSquare.spriteCount; i++) {
            const sprite = linkedSquare.sprites[i];
            if (sprite) {
              let model = sprite.model;
              if (!model) {
                model = sprite.entity?.getTempModel(loopCycle) ?? null;
              }
              model?.worldRender(sprite.yaw, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, sprite.x - World.cx, sprite.y - World.cy, sprite.z - World.cz, sprite.typecode);
            }
          }
        }
        let tileDrawn = false;
        if (!tile.quickGround) {
          if (tile.ground && !this.groundOccluded(originalLevel, tileX, tileZ)) {
            tileDrawn = true;
            this.renderGround(tileX, tileZ, tile.ground, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY);
          }
        } else if (!this.groundOccluded(originalLevel, tileX, tileZ)) {
          tileDrawn = true;
          this.renderQuickGround(tile.quickGround, originalLevel, tileX, tileZ, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY);
        }
        let direction = 0;
        let frontWallTypes = 0;
        const wall = tile.wall;
        const decor = tile.decor;
        if (wall || decor) {
          if (World.gx === tileX) {
            direction += 1;
          } else if (World.gx < tileX) {
            direction += 2;
          }
          if (World.gz === tileZ) {
            direction += 3;
          } else if (World.gz > tileZ) {
            direction += 6;
          }
          frontWallTypes = PRETAB[direction];
          tile.backWallTypes = POSTTAB[direction];
        }
        if (wall) {
          if ((wall.angle1 & MIDTAB[direction]) === 0) {
            tile.cornerSides = 0;
          } else if (wall.angle1 === 16) {
            tile.cornerSides = 3;
            tile.sidesBeforeCorner = MIDDEP_16[direction];
            tile.sidesAfterCorner = 3 - tile.sidesBeforeCorner;
          } else if (wall.angle1 === 32) {
            tile.cornerSides = 6;
            tile.sidesBeforeCorner = MIDDEP_32[direction];
            tile.sidesAfterCorner = 6 - tile.sidesBeforeCorner;
          } else if (wall.angle1 === 64) {
            tile.cornerSides = 12;
            tile.sidesBeforeCorner = MIDDEP_64[direction];
            tile.sidesAfterCorner = 12 - tile.sidesBeforeCorner;
          } else {
            tile.cornerSides = 9;
            tile.sidesBeforeCorner = MIDDEP_128[direction];
            tile.sidesAfterCorner = 9 - tile.sidesBeforeCorner;
          }
          if ((wall.angle1 & frontWallTypes) !== 0 && !this.wallOccluded(originalLevel, tileX, tileZ, wall.angle1)) {
            wall.model1?.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, wall.x - World.cx, wall.y - World.cy, wall.z - World.cz, wall.typecode);
          }
          if ((wall.angle2 & frontWallTypes) !== 0 && !this.wallOccluded(originalLevel, tileX, tileZ, wall.angle2)) {
            wall.model2?.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, wall.x - World.cx, wall.y - World.cy, wall.z - World.cz, wall.typecode);
          }
        }
        if (decor && !this.spriteOccluded(originalLevel, tileX, tileZ, decor.model.minY)) {
          if ((decor.wshape & frontWallTypes) !== 0) {
            decor.model.worldRender(decor.angle, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, decor.x - World.cx, decor.y - World.cy, decor.z - World.cz, decor.typecode);
          } else if ((decor.wshape & 768) !== 0) {
            const x = decor.x - World.cx;
            const y = decor.y - World.cy;
            const z = decor.z - World.cz;
            const angle = decor.angle;
            let nearestX;
            if (angle === 1 /* NORTH */ || angle === 2 /* EAST */) {
              nearestX = -x;
            } else {
              nearestX = x;
            }
            let nearestZ;
            if (angle === 2 /* EAST */ || angle === 3 /* SOUTH */) {
              nearestZ = -z;
            } else {
              nearestZ = z;
            }
            if ((decor.wshape & 256) !== 0 && nearestZ < nearestX) {
              const drawX = x + DECORXOF[angle];
              const drawZ = z + DECORZOF[angle];
              decor.model.worldRender(angle * 512 + 256, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, drawX, y, drawZ, decor.typecode);
            }
            if ((decor.wshape & 512) !== 0 && nearestZ > nearestX) {
              const drawX = x + DECORXOF2[angle];
              const drawZ = z + DECORZOF2[angle];
              decor.model.worldRender(angle * 512 + 1280 & 2047, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, drawX, y, drawZ, decor.typecode);
            }
          }
        }
        if (tileDrawn) {
          const groundDecor = tile.groundDecor;
          if (groundDecor) {
            groundDecor.model?.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, groundDecor.x - World.cx, groundDecor.y - World.cy, groundDecor.z - World.cz, groundDecor.typecode);
          }
          const objs2 = tile.groundObject;
          if (objs2 && objs2.height === 0) {
            if (objs2.bottomObj) {
              objs2.bottomObj.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, objs2.x - World.cx, objs2.y - World.cy, objs2.z - World.cz, objs2.typecode);
            }
            if (objs2.middleObj) {
              objs2.middleObj.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, objs2.x - World.cx, objs2.y - World.cy, objs2.z - World.cz, objs2.typecode);
            }
            if (objs2.topObj) {
              objs2.topObj.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, objs2.x - World.cx, objs2.y - World.cy, objs2.z - World.cz, objs2.typecode);
            }
          }
        }
        const spans = tile.spriteSpans;
        if (spans !== 0) {
          if (tileX < World.gx && (spans & 4) !== 0) {
            const adjacent = tiles[tileX + 1][tileZ];
            if (adjacent && adjacent.drawBack) {
              World.fillQueue.push(adjacent);
            }
          }
          if (tileZ < World.gz && (spans & 2) !== 0) {
            const adjacent = tiles[tileX][tileZ + 1];
            if (adjacent && adjacent.drawBack) {
              World.fillQueue.push(adjacent);
            }
          }
          if (tileX > World.gx && (spans & 1) !== 0) {
            const adjacent = tiles[tileX - 1][tileZ];
            if (adjacent && adjacent.drawBack) {
              World.fillQueue.push(adjacent);
            }
          }
          if (tileZ > World.gz && (spans & 8) !== 0) {
            const adjacent = tiles[tileX][tileZ - 1];
            if (adjacent && adjacent.drawBack) {
              World.fillQueue.push(adjacent);
            }
          }
        }
      }
      if (tile.cornerSides !== 0) {
        let draw = true;
        for (let i = 0;i < tile.spriteCount; i++) {
          const sprite = tile.sprites[i];
          if (!sprite) {
            continue;
          }
          if (sprite.cycle !== World.cycleNo && (tile.spriteSpan[i] & tile.cornerSides) === tile.sidesBeforeCorner) {
            draw = false;
            break;
          }
        }
        if (draw) {
          const wall = tile.wall;
          if (wall && !this.wallOccluded(originalLevel, tileX, tileZ, wall.angle1)) {
            wall.model1?.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, wall.x - World.cx, wall.y - World.cy, wall.z - World.cz, wall.typecode);
          }
          tile.cornerSides = 0;
        }
      }
      if (tile.drawSprites) {
        const spriteCount = tile.spriteCount;
        tile.drawSprites = false;
        let spriteBufferSize = 0;
        iterate_sprites:
          for (let i = 0;i < spriteCount; i++) {
            const sprite = tile.sprites[i];
            if (!sprite || sprite.cycle === World.cycleNo) {
              continue;
            }
            for (let x = sprite.minTileX;x <= sprite.maxTileX; x++) {
              for (let z = sprite.minTileZ;z <= sprite.maxTileZ; z++) {
                const other = tiles[x][z];
                if (!other) {
                  continue;
                }
                if (other.drawFront) {
                  tile.drawSprites = true;
                  continue iterate_sprites;
                }
                if (other.cornerSides === 0) {
                  continue;
                }
                let spans = 0;
                if (x > sprite.minTileX) {
                  spans += 1;
                }
                if (x < sprite.maxTileX) {
                  spans += 4;
                }
                if (z > sprite.minTileZ) {
                  spans += 8;
                }
                if (z < sprite.maxTileZ) {
                  spans += 2;
                }
                if ((spans & other.cornerSides) !== tile.sidesAfterCorner) {
                  continue;
                }
              }
            }
            World.spriteBuffer[spriteBufferSize++] = sprite;
            let minTileDistanceX = World.gx - sprite.minTileX;
            const maxTileDistanceX = sprite.maxTileX - World.gx;
            if (maxTileDistanceX > minTileDistanceX) {
              minTileDistanceX = maxTileDistanceX;
            }
            const minTileDistanceZ = World.gz - sprite.minTileZ;
            const maxTileDistanceZ = sprite.maxTileZ - World.gz;
            if (maxTileDistanceZ > minTileDistanceZ) {
              sprite.distance = minTileDistanceX + maxTileDistanceZ;
            } else {
              sprite.distance = minTileDistanceX + minTileDistanceZ;
            }
          }
        while (spriteBufferSize > 0) {
          let farthestDistance = -50;
          let farthestIndex = -1;
          for (let index = 0;index < spriteBufferSize; index++) {
            const sprite = World.spriteBuffer[index];
            if (!sprite) {
              continue;
            }
            if (sprite.distance > farthestDistance && sprite.cycle !== World.cycleNo) {
              farthestDistance = sprite.distance;
              farthestIndex = index;
            }
          }
          if (farthestIndex === -1) {
            break;
          }
          const farthest = World.spriteBuffer[farthestIndex];
          if (farthest) {
            farthest.cycle = World.cycleNo;
            let model = farthest.model;
            if (!model) {
              model = farthest.entity?.getTempModel(loopCycle) ?? null;
            }
            if (model && !this.spriteOccluded2(originalLevel, farthest.minTileX, farthest.maxTileX, farthest.minTileZ, farthest.maxTileZ, model.minY)) {
              model.worldRender(farthest.yaw, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, farthest.x - World.cx, farthest.y - World.cy, farthest.z - World.cz, farthest.typecode);
            }
            for (let x = farthest.minTileX;x <= farthest.maxTileX; x++) {
              for (let z = farthest.minTileZ;z <= farthest.maxTileZ; z++) {
                const occupied = tiles[x][z];
                if (!occupied) {
                  continue;
                }
                if (occupied.cornerSides !== 0) {
                  World.fillQueue.push(occupied);
                } else if ((x !== tileX || z !== tileZ) && occupied.drawBack) {
                  World.fillQueue.push(occupied);
                }
              }
            }
          }
        }
        if (tile.drawSprites) {
          continue;
        }
      }
      if (!tile.drawBack || tile.cornerSides !== 0) {
        continue;
      }
      if (tileX <= World.gx && tileX > World.minX) {
        const adjacent = tiles[tileX - 1][tileZ];
        if (adjacent && adjacent.drawBack) {
          continue;
        }
      }
      if (tileX >= World.gx && tileX < World.maxX - 1) {
        const adjacent = tiles[tileX + 1][tileZ];
        if (adjacent && adjacent.drawBack) {
          continue;
        }
      }
      if (tileZ <= World.gz && tileZ > World.minZ) {
        const adjacent = tiles[tileX][tileZ - 1];
        if (adjacent && adjacent.drawBack) {
          continue;
        }
      }
      if (tileZ >= World.gz && tileZ < World.maxZ - 1) {
        const adjacent = tiles[tileX][tileZ + 1];
        if (adjacent && adjacent.drawBack) {
          continue;
        }
      }
      tile.drawBack = false;
      World.fillLeft--;
      const objs = tile.groundObject;
      if (objs && objs.height !== 0) {
        if (objs.bottomObj) {
          objs.bottomObj.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, objs.x - World.cx, objs.y - World.cy - objs.height, objs.z - World.cz, objs.typecode);
        }
        if (objs.middleObj) {
          objs.middleObj.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, objs.x - World.cx, objs.y - World.cy - objs.height, objs.z - World.cz, objs.typecode);
        }
        if (objs.topObj) {
          objs.topObj.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, objs.x - World.cx, objs.y - World.cy - objs.height, objs.z - World.cz, objs.typecode);
        }
      }
      if (tile.backWallTypes !== 0) {
        const decor = tile.decor;
        if (decor && !this.spriteOccluded(originalLevel, tileX, tileZ, decor.model.minY)) {
          if ((decor.wshape & tile.backWallTypes) !== 0) {
            decor.model.worldRender(decor.angle, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, decor.x - World.cx, decor.y - World.cy, decor.z - World.cz, decor.typecode);
          } else if ((decor.wshape & 768) !== 0) {
            const x = decor.x - World.cx;
            const y = decor.y - World.cy;
            const z = decor.z - World.cz;
            const angle = decor.angle;
            let nearestX;
            if (angle === 1 /* NORTH */ || angle === 2 /* EAST */) {
              nearestX = -x;
            } else {
              nearestX = x;
            }
            let nearestZ;
            if (angle === 2 /* EAST */ || angle === 3 /* SOUTH */) {
              nearestZ = -z;
            } else {
              nearestZ = z;
            }
            if ((decor.wshape & 256) !== 0 && nearestZ >= nearestX) {
              const drawX = x + DECORXOF[angle];
              const drawZ = z + DECORZOF[angle];
              decor.model.worldRender(angle * 512 + 256, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, drawX, y, drawZ, decor.typecode);
            }
            if ((decor.wshape & 512) !== 0 && nearestZ <= nearestX) {
              const drawX = x + DECORXOF2[angle];
              const drawZ = z + DECORZOF2[angle];
              decor.model.worldRender(angle * 512 + 1280 & 2047, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, drawX, y, drawZ, decor.typecode);
            }
          }
        }
        const wall = tile.wall;
        if (wall) {
          if ((wall.angle2 & tile.backWallTypes) !== 0 && !this.wallOccluded(originalLevel, tileX, tileZ, wall.angle2)) {
            wall.model2?.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, wall.x - World.cx, wall.y - World.cy, wall.z - World.cz, wall.typecode);
          }
          if ((wall.angle1 & tile.backWallTypes) !== 0 && !this.wallOccluded(originalLevel, tileX, tileZ, wall.angle1)) {
            wall.model1?.worldRender(0, World.cameraSinX, World.cameraCosX, World.cameraSinY, World.cameraCosY, wall.x - World.cx, wall.y - World.cy, wall.z - World.cz, wall.typecode);
          }
        }
      }
      if (level < this.maxTileLevel - 1) {
        const above = this.squares[level + 1][tileX][tileZ];
        if (above && above.drawBack) {
          World.fillQueue.push(above);
        }
      }
      if (tileX < World.gx) {
        const adjacent = tiles[tileX + 1][tileZ];
        if (adjacent && adjacent.drawBack) {
          World.fillQueue.push(adjacent);
        }
      }
      if (tileZ < World.gz) {
        const adjacent = tiles[tileX][tileZ + 1];
        if (adjacent && adjacent.drawBack) {
          World.fillQueue.push(adjacent);
        }
      }
      if (tileX > World.gx) {
        const adjacent = tiles[tileX - 1][tileZ];
        if (adjacent && adjacent.drawBack) {
          World.fillQueue.push(adjacent);
        }
      }
      if (tileZ > World.gz) {
        const adjacent = tiles[tileX][tileZ - 1];
        if (adjacent && adjacent.drawBack) {
          World.fillQueue.push(adjacent);
        }
      }
    }
  }
  renderQuickGround(ground, level, tileX, tileZ, sinEyePitch, cosEyePitch, sinEyeYaw, cosEyeYaw) {
    let x3;
    let x0 = x3 = (tileX << 7) - World.cx;
    let z1;
    let z0 = z1 = (tileZ << 7) - World.cz;
    let x2;
    let x1 = x2 = x0 + 128;
    let z3;
    let z2 = z3 = z0 + 128;
    let y0 = this.groundh[level][tileX][tileZ] - World.cy;
    let y1 = this.groundh[level][tileX + 1][tileZ] - World.cy;
    let y2 = this.groundh[level][tileX + 1][tileZ + 1] - World.cy;
    let y3 = this.groundh[level][tileX][tileZ + 1] - World.cy;
    let tmp = z0 * sinEyeYaw + x0 * cosEyeYaw >> 16;
    z0 = z0 * cosEyeYaw - x0 * sinEyeYaw >> 16;
    x0 = tmp;
    tmp = y0 * cosEyePitch - z0 * sinEyePitch >> 16;
    z0 = y0 * sinEyePitch + z0 * cosEyePitch >> 16;
    y0 = tmp;
    if (z0 < 50) {
      return;
    }
    tmp = z1 * sinEyeYaw + x1 * cosEyeYaw >> 16;
    z1 = z1 * cosEyeYaw - x1 * sinEyeYaw >> 16;
    x1 = tmp;
    tmp = y1 * cosEyePitch - z1 * sinEyePitch >> 16;
    z1 = y1 * sinEyePitch + z1 * cosEyePitch >> 16;
    y1 = tmp;
    if (z1 < 50) {
      return;
    }
    tmp = z2 * sinEyeYaw + x2 * cosEyeYaw >> 16;
    z2 = z2 * cosEyeYaw - x2 * sinEyeYaw >> 16;
    x2 = tmp;
    tmp = y2 * cosEyePitch - z2 * sinEyePitch >> 16;
    z2 = y2 * sinEyePitch + z2 * cosEyePitch >> 16;
    y2 = tmp;
    if (z2 < 50) {
      return;
    }
    tmp = z3 * sinEyeYaw + x3 * cosEyeYaw >> 16;
    z3 = z3 * cosEyeYaw - x3 * sinEyeYaw >> 16;
    x3 = tmp;
    tmp = y3 * cosEyePitch - z3 * sinEyePitch >> 16;
    z3 = y3 * sinEyePitch + z3 * cosEyePitch >> 16;
    y3 = tmp;
    if (z3 < 50) {
      return;
    }
    const px0 = Pix3D.originX + ((x0 << 9) / z0 | 0);
    const py0 = Pix3D.originY + ((y0 << 9) / z0 | 0);
    const pz0 = Pix3D.originX + ((x1 << 9) / z1 | 0);
    const px1 = Pix3D.originY + ((y1 << 9) / z1 | 0);
    const py1 = Pix3D.originX + ((x2 << 9) / z2 | 0);
    const pz1 = Pix3D.originY + ((y2 << 9) / z2 | 0);
    const px3 = Pix3D.originX + ((x3 << 9) / z3 | 0);
    const py3 = Pix3D.originY + ((y3 << 9) / z3 | 0);
    Pix3D.trans = 0;
    if ((py1 - px3) * (px1 - py3) - (pz1 - py3) * (pz0 - px3) > 0) {
      Pix3D.hclip = py1 < 0 || px3 < 0 || pz0 < 0 || py1 > Pix2D.sizeX || px3 > Pix2D.sizeX || pz0 > Pix2D.sizeX;
      if (World.click && this.insideTriangle(World.clickX, World.clickY, pz1, py3, px1, py1, px3, pz0)) {
        World.groundX = tileX;
        World.groundZ = tileZ;
      }
      if (ground.texture !== -1) {
        if (!World.lowMem) {
          if (ground.flat) {
            Pix3D.textureTriangle(py1, px3, pz0, pz1, py3, px1, ground.colourNE, ground.colourNW, ground.colourSE, x0, y0, z0, x1, x3, y1, y3, z1, z3, ground.texture);
          } else {
            Pix3D.textureTriangle(py1, px3, pz0, pz1, py3, px1, ground.colourNE, ground.colourNW, ground.colourSE, x2, y2, z2, x3, x1, y3, y1, z3, z1, ground.texture);
          }
        } else {
          const textureAverage = TEXTURE_AVERAGE[ground.texture];
          Pix3D.gouraudTriangle(py1, px3, pz0, pz1, py3, px1, this.getTable(textureAverage, ground.colourNE), this.getTable(textureAverage, ground.colourNW), this.getTable(textureAverage, ground.colourSE));
        }
      } else {
        if (ground.colourNE !== 12345678) {
          Pix3D.gouraudTriangle(py1, px3, pz0, pz1, py3, px1, ground.colourNE, ground.colourNW, ground.colourSE);
        }
      }
    }
    if ((px0 - pz0) * (py3 - px1) - (py0 - px1) * (px3 - pz0) > 0) {
      Pix3D.hclip = px0 < 0 || pz0 < 0 || px3 < 0 || px0 > Pix2D.sizeX || pz0 > Pix2D.sizeX || px3 > Pix2D.sizeX;
      if (World.click && this.insideTriangle(World.clickX, World.clickY, py0, px1, py3, px0, pz0, px3)) {
        World.groundX = tileX;
        World.groundZ = tileZ;
      }
      if (ground.texture !== -1) {
        if (!World.lowMem) {
          Pix3D.textureTriangle(px0, pz0, px3, py0, px1, py3, ground.colourSW, ground.colourSE, ground.colourNW, x0, y0, z0, x1, x3, y1, y3, z1, z3, ground.texture);
        } else {
          const textureAverage = TEXTURE_AVERAGE[ground.texture];
          Pix3D.gouraudTriangle(px0, pz0, px3, py0, px1, py3, this.getTable(textureAverage, ground.colourSW), this.getTable(textureAverage, ground.colourSE), this.getTable(textureAverage, ground.colourNW));
        }
      } else {
        if (ground.colourSW !== 12345678) {
          Pix3D.gouraudTriangle(px0, pz0, px3, py0, px1, py3, ground.colourSW, ground.colourSE, ground.colourNW);
        }
      }
    }
  }
  renderGround(tileX, tileZ, ground, sinEyePitch, cosEyePitch, sinEyeYaw, cosEyeYaw) {
    let vertexCount = ground.vertexX.length;
    for (let i = 0;i < vertexCount; i++) {
      let x = ground.vertexX[i] - World.cx;
      let y = ground.vertexY[i] - World.cy;
      let z = ground.vertexZ[i] - World.cz;
      let tmp = z * sinEyeYaw + x * cosEyeYaw >> 16;
      z = z * cosEyeYaw - x * sinEyeYaw >> 16;
      x = tmp;
      tmp = y * cosEyePitch - z * sinEyePitch >> 16;
      z = y * sinEyePitch + z * cosEyePitch >> 16;
      y = tmp;
      if (z < 50) {
        return;
      }
      if (ground.faceTexture) {
        Ground.drawTextureVertexX[i] = x;
        Ground.drawTextureVertexY[i] = y;
        Ground.drawTextureVertexZ[i] = z;
      }
      Ground.drawVertexX[i] = Pix3D.originX + ((x << 9) / z | 0);
      Ground.drawVertexY[i] = Pix3D.originY + ((y << 9) / z | 0);
    }
    Pix3D.trans = 0;
    vertexCount = ground.faceVertexA.length;
    for (let v = 0;v < vertexCount; v++) {
      const a = ground.faceVertexA[v];
      const b = ground.faceVertexB[v];
      const c = ground.faceVertexC[v];
      const x0 = Ground.drawVertexX[a];
      const x1 = Ground.drawVertexX[b];
      const x2 = Ground.drawVertexX[c];
      const y0 = Ground.drawVertexY[a];
      const y1 = Ground.drawVertexY[b];
      const y2 = Ground.drawVertexY[c];
      if ((x0 - x1) * (y2 - y1) - (y0 - y1) * (x2 - x1) > 0) {
        Pix3D.hclip = x0 < 0 || x1 < 0 || x2 < 0 || x0 > Pix2D.sizeX || x1 > Pix2D.sizeX || x2 > Pix2D.sizeX;
        if (World.click && this.insideTriangle(World.clickX, World.clickY, y0, y1, y2, x0, x1, x2)) {
          World.groundX = tileX;
          World.groundZ = tileZ;
        }
        if (ground.faceTexture && ground.faceTexture[v] !== -1) {
          if (!World.lowMem) {
            if (ground.flat) {
              Pix3D.textureTriangle(x0, x1, x2, y0, y1, y2, ground.faceColourA[v], ground.faceColourB[v], ground.faceColourC[v], Ground.drawTextureVertexX[0], Ground.drawTextureVertexY[0], Ground.drawTextureVertexZ[0], Ground.drawTextureVertexX[1], Ground.drawTextureVertexX[3], Ground.drawTextureVertexY[1], Ground.drawTextureVertexY[3], Ground.drawTextureVertexZ[1], Ground.drawTextureVertexZ[3], ground.faceTexture[v]);
            } else {
              Pix3D.textureTriangle(x0, x1, x2, y0, y1, y2, ground.faceColourA[v], ground.faceColourB[v], ground.faceColourC[v], Ground.drawTextureVertexX[a], Ground.drawTextureVertexY[a], Ground.drawTextureVertexZ[a], Ground.drawTextureVertexX[b], Ground.drawTextureVertexX[c], Ground.drawTextureVertexY[b], Ground.drawTextureVertexY[c], Ground.drawTextureVertexZ[b], Ground.drawTextureVertexZ[c], ground.faceTexture[v]);
            }
          } else {
            const textureAverage = TEXTURE_AVERAGE[ground.faceTexture[v]];
            Pix3D.gouraudTriangle(x0, x1, x2, y0, y1, y2, this.getTable(textureAverage, ground.faceColourA[v]), this.getTable(textureAverage, ground.faceColourB[v]), this.getTable(textureAverage, ground.faceColourC[v]));
          }
        } else {
          if (ground.faceColourA[v] !== 12345678) {
            Pix3D.gouraudTriangle(x0, x1, x2, y0, y1, y2, ground.faceColourA[v], ground.faceColourB[v], ground.faceColourC[v]);
          }
        }
      }
    }
  }
  groundOccluded(level, x, z) {
    const cycle = this.occlusionCycle[level][x][z];
    if (cycle === -World.cycleNo) {
      return false;
    } else if (cycle === World.cycleNo) {
      return true;
    } else {
      const sx = x << 7;
      const sz = z << 7;
      if (this.occluded(sx + 1, this.groundh[level][x][z], sz + 1) && this.occluded(sx + 128 - 1, this.groundh[level][x + 1][z], sz + 1) && this.occluded(sx + 128 - 1, this.groundh[level][x + 1][z + 1], sz + 128 - 1) && this.occluded(sx + 1, this.groundh[level][x][z + 1], sz + 128 - 1)) {
        this.occlusionCycle[level][x][z] = World.cycleNo;
        return true;
      } else {
        this.occlusionCycle[level][x][z] = -World.cycleNo;
        return false;
      }
    }
  }
  wallOccluded(level, x, z, type) {
    if (!this.groundOccluded(level, x, z)) {
      return false;
    }
    const sceneX = x << 7;
    const sceneZ = z << 7;
    const sceneY = this.groundh[level][x][z] - 1;
    const y0 = sceneY - 120;
    const y1 = sceneY - 230;
    const y2 = sceneY - 238;
    if (type < 16) {
      if (type === 1) {
        if (sceneX > World.cx) {
          if (!this.occluded(sceneX, sceneY, sceneZ)) {
            return false;
          }
          if (!this.occluded(sceneX, sceneY, sceneZ + 128)) {
            return false;
          }
        }
        if (level > 0) {
          if (!this.occluded(sceneX, y0, sceneZ)) {
            return false;
          }
          if (!this.occluded(sceneX, y0, sceneZ + 128)) {
            return false;
          }
        }
        if (!this.occluded(sceneX, y1, sceneZ)) {
          return false;
        }
        return this.occluded(sceneX, y1, sceneZ + 128);
      }
      if (type === 2) {
        if (sceneZ < World.cz) {
          if (!this.occluded(sceneX, sceneY, sceneZ + 128)) {
            return false;
          }
          if (!this.occluded(sceneX + 128, sceneY, sceneZ + 128)) {
            return false;
          }
        }
        if (level > 0) {
          if (!this.occluded(sceneX, y0, sceneZ + 128)) {
            return false;
          }
          if (!this.occluded(sceneX + 128, y0, sceneZ + 128)) {
            return false;
          }
        }
        if (!this.occluded(sceneX, y1, sceneZ + 128)) {
          return false;
        }
        return this.occluded(sceneX + 128, y1, sceneZ + 128);
      }
      if (type === 4) {
        if (sceneX < World.cx) {
          if (!this.occluded(sceneX + 128, sceneY, sceneZ)) {
            return false;
          }
          if (!this.occluded(sceneX + 128, sceneY, sceneZ + 128)) {
            return false;
          }
        }
        if (level > 0) {
          if (!this.occluded(sceneX + 128, y0, sceneZ)) {
            return false;
          }
          if (!this.occluded(sceneX + 128, y0, sceneZ + 128)) {
            return false;
          }
        }
        if (!this.occluded(sceneX + 128, y1, sceneZ)) {
          return false;
        }
        return this.occluded(sceneX + 128, y1, sceneZ + 128);
      }
      if (type === 8) {
        if (sceneZ > World.cz) {
          if (!this.occluded(sceneX, sceneY, sceneZ)) {
            return false;
          }
          if (!this.occluded(sceneX + 128, sceneY, sceneZ)) {
            return false;
          }
        }
        if (level > 0) {
          if (!this.occluded(sceneX, y0, sceneZ)) {
            return false;
          }
          if (!this.occluded(sceneX + 128, y0, sceneZ)) {
            return false;
          }
        }
        if (!this.occluded(sceneX, y1, sceneZ)) {
          return false;
        }
        return this.occluded(sceneX + 128, y1, sceneZ);
      }
    }
    if (!this.occluded(sceneX + 64, y2, sceneZ + 64)) {
      return false;
    } else if (type === 16) {
      return this.occluded(sceneX, y1, sceneZ + 128);
    } else if (type === 32) {
      return this.occluded(sceneX + 128, y1, sceneZ + 128);
    } else if (type === 64) {
      return this.occluded(sceneX + 128, y1, sceneZ);
    } else if (type === 128) {
      return this.occluded(sceneX, y1, sceneZ);
    }
    console.warn("Warning unsupported wall type");
    return true;
  }
  spriteOccluded(level, tileX, tileZ, y) {
    if (this.groundOccluded(level, tileX, tileZ)) {
      const x = tileX << 7;
      const z = tileZ << 7;
      return this.occluded(x + 1, this.groundh[level][tileX][tileZ] - y, z + 1) && this.occluded(x + 128 - 1, this.groundh[level][tileX + 1][tileZ] - y, z + 1) && this.occluded(x + 128 - 1, this.groundh[level][tileX + 1][tileZ + 1] - y, z + 128 - 1) && this.occluded(x + 1, this.groundh[level][tileX][tileZ + 1] - y, z + 128 - 1);
    }
    return false;
  }
  spriteOccluded2(level, minX, maxX, minZ, maxZ, y) {
    let x;
    let z;
    if (minX !== maxX || minZ !== maxZ) {
      for (x = minX;x <= maxX; x++) {
        for (z = minZ;z <= maxZ; z++) {
          if (this.occlusionCycle[level][x][z] === -World.cycleNo) {
            return false;
          }
        }
      }
      z = (minX << 7) + 1;
      const z0 = (minZ << 7) + 2;
      const y0 = this.groundh[level][minX][minZ] - y;
      if (!this.occluded(z, y0, z0)) {
        return false;
      }
      const x1 = (maxX << 7) - 1;
      if (!this.occluded(x1, y0, z0)) {
        return false;
      }
      const z1 = (maxZ << 7) - 1;
      if (!this.occluded(z, y0, z1)) {
        return false;
      } else if (this.occluded(x1, y0, z1)) {
        return true;
      } else {
        return false;
      }
    } else if (this.groundOccluded(level, minX, minZ)) {
      x = minX << 7;
      z = minZ << 7;
      return this.occluded(x + 1, this.groundh[level][minX][minZ] - y, z + 1) && this.occluded(x + 128 - 1, this.groundh[level][minX + 1][minZ] - y, z + 1) && this.occluded(x + 128 - 1, this.groundh[level][minX + 1][minZ + 1] - y, z + 128 - 1) && this.occluded(x + 1, this.groundh[level][minX][minZ + 1] - y, z + 128 - 1);
    }
    return false;
  }
  occluded(x, y, z) {
    for (let i = 0;i < World.numActiveOccluders; i++) {
      const occluder = World.activeOccluders[i];
      if (!occluder) {
        continue;
      }
      if (occluder.mode === 1) {
        const dx = occluder.minX - x;
        if (dx > 0) {
          const minZ = occluder.minZ + (occluder.minDeltaZ * dx >> 8);
          const maxZ = occluder.maxZ + (occluder.maxDeltaZ * dx >> 8);
          const minY = occluder.minY + (occluder.minDeltaY * dx >> 8);
          const maxY = occluder.maxY + (occluder.maxDeltaY * dx >> 8);
          if (z >= minZ && z <= maxZ && y >= minY && y <= maxY) {
            return true;
          }
        }
      } else if (occluder.mode === 2) {
        const dx = x - occluder.minX;
        if (dx > 0) {
          const minZ = occluder.minZ + (occluder.minDeltaZ * dx >> 8);
          const maxZ = occluder.maxZ + (occluder.maxDeltaZ * dx >> 8);
          const minY = occluder.minY + (occluder.minDeltaY * dx >> 8);
          const maxY = occluder.maxY + (occluder.maxDeltaY * dx >> 8);
          if (z >= minZ && z <= maxZ && y >= minY && y <= maxY) {
            return true;
          }
        }
      } else if (occluder.mode === 3) {
        const dz = occluder.minZ - z;
        if (dz > 0) {
          const minX = occluder.minX + (occluder.minDeltaX * dz >> 8);
          const maxX = occluder.maxX + (occluder.maxDeltaX * dz >> 8);
          const minY = occluder.minY + (occluder.minDeltaY * dz >> 8);
          const maxY = occluder.maxY + (occluder.maxDeltaY * dz >> 8);
          if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            return true;
          }
        }
      } else if (occluder.mode === 4) {
        const dz = z - occluder.minZ;
        if (dz > 0) {
          const minX = occluder.minX + (occluder.minDeltaX * dz >> 8);
          const maxX = occluder.maxX + (occluder.maxDeltaX * dz >> 8);
          const minY = occluder.minY + (occluder.minDeltaY * dz >> 8);
          const maxY = occluder.maxY + (occluder.maxDeltaY * dz >> 8);
          if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            return true;
          }
        }
      } else if (occluder.mode === 5) {
        const dy = y - occluder.minY;
        if (dy > 0) {
          const minX = occluder.minX + (occluder.minDeltaX * dy >> 8);
          const maxX = occluder.maxX + (occluder.maxDeltaX * dy >> 8);
          const minZ = occluder.minZ + (occluder.minDeltaZ * dy >> 8);
          const maxZ = occluder.maxZ + (occluder.maxDeltaZ * dy >> 8);
          if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
            return true;
          }
        }
      }
    }
    return false;
  }
  insideTriangle(x, y, y0, y1, y2, x0, x1, x2) {
    if (y < y0 && y < y1 && y < y2) {
      return false;
    } else if (y > y0 && y > y1 && y > y2) {
      return false;
    } else if (x < x0 && x < x1 && x < x2) {
      return false;
    } else if (x > x0 && x > x1 && x > x2) {
      return false;
    }
    const crossProduct_01 = (y - y0) * (x1 - x0) - (x - x0) * (y1 - y0);
    const crossProduct_20 = (y - y2) * (x0 - x2) - (x - x2) * (y0 - y2);
    const crossProduct_12 = (y - y1) * (x2 - x1) - (x - x1) * (y2 - y1);
    return crossProduct_01 * crossProduct_12 > 0 && crossProduct_12 * crossProduct_20 > 0;
  }
  getTable(hsl, lightness) {
    const invLightness = 127 - lightness;
    lightness = invLightness * (hsl & 127) / 160 | 0;
    if (lightness < 2) {
      lightness = 2;
    } else if (lightness > 126) {
      lightness = 126;
    }
    return (hsl & 65408) + lightness;
  }
}

// src/dash3d/ClientLocAnim.ts
class ClientLocAnim extends Linkable {
  index;
  heightSW;
  heightSE;
  heightNE;
  heightNW;
  anim;
  animFrame;
  animCycle;
  constructor(index, heightSW, heightSE, heightNE, heightNW, seq, randomFrame) {
    super();
    this.index = index;
    this.heightSW = heightSW;
    this.heightSE = heightSE;
    this.heightNE = heightNE;
    this.heightNW = heightNW;
    this.anim = seq;
    if (randomFrame && seq.loops !== -1 && this.anim.delay) {
      this.animFrame = Math.random() * this.anim.numFrames | 0;
      this.animCycle = Math.random() * this.anim.delay[this.animFrame] | 0;
    } else {
      this.animFrame = -1;
      this.animCycle = 0;
    }
  }
}

// src/client/ClientBuild.ts
class ClientBuild {
  static WSHAPE0 = Int8Array.of(1, 2, 4, 8);
  static WSHAPE1 = Uint8Array.of(16, 32, 64, 128);
  static DECORXOF = Int8Array.of(1, 0, -1, 0);
  static DECORZOF = Int8Array.of(0, -1, 0, 1);
  static hueOff = (Math.random() * 17 | 0) - 8;
  static ligOff = (Math.random() * 33 | 0) - 16;
  static lowMem = true;
  static minusedlevel = 0;
  static fullbright = false;
  maxTileX;
  maxTileZ;
  groundh;
  mapl;
  floort1;
  floort2;
  floors;
  floorr;
  shadow;
  lightmap;
  huetot;
  sattot;
  ligtot;
  comtot;
  tot;
  mapo;
  constructor(maxTileX, maxTileZ, groundh, mapl) {
    this.maxTileX = maxTileX;
    this.maxTileZ = maxTileZ;
    this.groundh = groundh;
    this.mapl = mapl;
    this.floort1 = new Uint8Array3d(4 /* LEVELS */, maxTileX, maxTileZ);
    this.floort2 = new Uint8Array3d(4 /* LEVELS */, maxTileX, maxTileZ);
    this.floors = new Uint8Array3d(4 /* LEVELS */, maxTileX, maxTileZ);
    this.floorr = new Uint8Array3d(4 /* LEVELS */, maxTileX, maxTileZ);
    this.mapo = new Int32Array3d(4 /* LEVELS */, maxTileX + 1, maxTileZ + 1);
    this.shadow = new Uint8Array3d(4 /* LEVELS */, maxTileX + 1, maxTileZ + 1);
    this.lightmap = new Int32Array2d(maxTileX + 1, maxTileZ + 1);
    this.huetot = new Int32Array(maxTileZ);
    this.sattot = new Int32Array(maxTileZ);
    this.ligtot = new Int32Array(maxTileZ);
    this.comtot = new Int32Array(maxTileZ);
    this.tot = new Int32Array(maxTileZ);
  }
  underlayAt(level, x, z) {
    return this.landAt(this.floort1, level, x, z);
  }
  overlayAt(level, x, z) {
    return this.landAt(this.floort2, level, x, z);
  }
  overlayShapeAt(level, x, z) {
    return this.landAt(this.floors, level, x, z);
  }
  overlayRotAt(level, x, z) {
    return this.landAt(this.floorr, level, x, z);
  }
  landAt(grid, level, x, z) {
    if (level < 0 || level >= grid.length || x < 0 || z < 0 || x >= this.maxTileX || z >= this.maxTileZ) {
      return 0;
    }
    return grid[level][x][z];
  }
  finishBuild(world, collision) {
    for (let level = 0;level < 4 /* LEVELS */; level++) {
      for (let x = 0;x < 104 /* SIZE */; x++) {
        for (let z = 0;z < 104 /* SIZE */; z++) {
          if ((this.mapl[level][x][z] & 1 /* Block */) !== 0) {
            let trueLevel = level;
            if ((this.mapl[1][x][z] & 2 /* LinkBelow */) !== 0) {
              trueLevel--;
            }
            if (trueLevel >= 0) {
              collision[trueLevel]?.blockGround(x, z);
            }
          }
        }
      }
    }
    ClientBuild.hueOff += (Math.random() * 5 | 0) - 2;
    if (ClientBuild.hueOff < -8) {
      ClientBuild.hueOff = -8;
    } else if (ClientBuild.hueOff > 8) {
      ClientBuild.hueOff = 8;
    }
    ClientBuild.ligOff += (Math.random() * 5 | 0) - 2;
    if (ClientBuild.ligOff < -16) {
      ClientBuild.ligOff = -16;
    } else if (ClientBuild.ligOff > 16) {
      ClientBuild.ligOff = 16;
    }
    for (let level = 0;level < 4 /* LEVELS */; level++) {
      const shademap = this.shadow[level];
      const lightAmbient = 96;
      const lightAttenuation = 768;
      const lightX = -50;
      const lightY = -10;
      const lightZ = -50;
      const lightMag = Math.sqrt(lightX * lightX + lightY * lightY + lightZ * lightZ) | 0;
      const lightMagnitude = lightAttenuation * lightMag >> 8;
      for (let z = 1;z < this.maxTileZ - 1; z++) {
        for (let x = 1;x < this.maxTileX - 1; x++) {
          const dx = this.groundh[level][x + 1][z] - this.groundh[level][x - 1][z];
          const dz = this.groundh[level][x][z + 1] - this.groundh[level][x][z - 1];
          const len = Math.sqrt(dx * dx + 65536 + dz * dz) | 0;
          const normalX = (dx << 8) / len | 0;
          const normalY = 65536 / len | 0;
          const normalZ = (dz << 8) / len | 0;
          const light = lightAmbient + ((lightX * normalX + lightY * normalY + lightZ * normalZ) / lightMagnitude | 0);
          const shade = (shademap[x - 1][z] >> 2) + (shademap[x + 1][z] >> 3) + (shademap[x][z - 1] >> 2) + (shademap[x][z + 1] >> 3) + (shademap[x][z] >> 1);
          this.lightmap[x][z] = light - shade;
        }
      }
      for (let z = 0;z < this.maxTileZ; z++) {
        this.huetot[z] = 0;
        this.sattot[z] = 0;
        this.ligtot[z] = 0;
        this.comtot[z] = 0;
        this.tot[z] = 0;
      }
      for (let x0 = -5;x0 < this.maxTileX + 5; x0++) {
        for (let z0 = 0;z0 < this.maxTileZ; z0++) {
          const x1 = x0 + 5;
          if (x1 >= 0 && x1 < this.maxTileX) {
            const t1 = this.floort1[level][x1][z0] & 255;
            if (t1 > 0) {
              const flo = FloType.list[t1 - 1];
              this.huetot[z0] += flo.underlayHue;
              this.sattot[z0] += flo.saturation;
              this.ligtot[z0] += flo.lightness;
              this.comtot[z0] += flo.chroma;
              this.tot[z0]++;
            }
          }
          const x2 = x0 - 5;
          if (x2 >= 0 && x2 < this.maxTileX) {
            const t1 = this.floort1[level][x2][z0] & 255;
            if (t1 > 0) {
              const flo = FloType.list[t1 - 1];
              this.huetot[z0] -= flo.underlayHue;
              this.sattot[z0] -= flo.saturation;
              this.ligtot[z0] -= flo.lightness;
              this.comtot[z0] -= flo.chroma;
              this.tot[z0]--;
            }
          }
        }
        if (x0 >= 1 && x0 < this.maxTileX - 1) {
          let blendHue = 0;
          let blendSat = 0;
          let blendLig = 0;
          let blendCom = 0;
          let blendTot = 0;
          for (let z0 = -5;z0 < this.maxTileZ + 5; z0++) {
            const dz1 = z0 + 5;
            if (dz1 >= 0 && dz1 < this.maxTileZ) {
              blendHue += this.huetot[dz1];
              blendSat += this.sattot[dz1];
              blendLig += this.ligtot[dz1];
              blendCom += this.comtot[dz1];
              blendTot += this.tot[dz1];
            }
            const dz2 = z0 - 5;
            if (dz2 >= 0 && dz2 < this.maxTileZ) {
              blendHue -= this.huetot[dz2];
              blendSat -= this.sattot[dz2];
              blendLig -= this.ligtot[dz2];
              blendCom -= this.comtot[dz2];
              blendTot -= this.tot[dz2];
            }
            if (z0 >= 1 && z0 < this.maxTileZ - 1 && (!ClientBuild.lowMem || (this.mapl[level][x0][z0] & 16 /* ForceHighDetail */) === 0 && this.getVisBelowLevel(level, x0, z0) === ClientBuild.minusedlevel)) {
              const t1 = this.floort1[level][x0][z0] & 255;
              const t2 = this.floort2[level][x0][z0] & 255;
              if (t1 > 0 || t2 > 0) {
                const heightSW = this.groundh[level][x0][z0];
                const heightSE = this.groundh[level][x0 + 1][z0];
                const heightNE = this.groundh[level][x0 + 1][z0 + 1];
                const heightNW = this.groundh[level][x0][z0 + 1];
                const lightSW = this.lightmap[x0][z0];
                const lightSE = this.lightmap[x0 + 1][z0];
                const lightNE = this.lightmap[x0 + 1][z0 + 1];
                const lightNW = this.lightmap[x0][z0 + 1];
                let t1Colour = -1;
                let t1RandColour = -1;
                if (t1 > 0) {
                  const hue = blendHue * 256 / blendCom | 0;
                  const sat = blendSat / blendTot | 0;
                  let lig = blendLig / blendTot | 0;
                  t1Colour = ClientBuild.getTable(hue, sat, lig);
                  const randomHue = hue + ClientBuild.hueOff & 255;
                  let randomLig = lig + ClientBuild.ligOff;
                  if (randomLig < 0) {
                    randomLig = 0;
                  } else if (randomLig > 255) {
                    randomLig = 255;
                  }
                  t1RandColour = ClientBuild.getTable(randomHue, sat, randomLig);
                }
                if (level > 0) {
                  let occludes = t1 !== 0 || this.floors[level][x0][z0] === 0 /* PLAIN */;
                  if (t2 > 0 && !FloType.list[t2 - 1].occlude) {
                    occludes = false;
                  }
                  if (occludes && heightSW === heightSE && heightSW === heightNE && heightSW === heightNW) {
                    this.mapo[level][x0][z0] |= 2340;
                  }
                }
                let underlay = 0;
                if (t1Colour !== -1) {
                  underlay = Pix3D.colourTable[ClientBuild.getUCol(t1RandColour, 96)];
                }
                if (t2 === 0) {
                  world?.setGround(level, x0, z0, 0 /* PLAIN */, 0 /* WEST */, -1, heightSW, heightSE, heightNE, heightNW, ClientBuild.getUCol(t1Colour, lightSW), ClientBuild.getUCol(t1Colour, lightSE), ClientBuild.getUCol(t1Colour, lightNE), ClientBuild.getUCol(t1Colour, lightNW), 0 /* BLACK */, 0 /* BLACK */, 0 /* BLACK */, 0 /* BLACK */, underlay, 0 /* BLACK */);
                } else {
                  const shape = this.floors[level][x0][z0] + 1;
                  const rotation = this.floorr[level][x0][z0];
                  const flo = FloType.list[t2 - 1];
                  let texture = flo.texture;
                  let t2Colour;
                  let overlay;
                  if (texture >= 0) {
                    overlay = Pix3D.getTextureAverage(texture);
                    t2Colour = -1;
                  } else if (flo.colour === 16711935 /* MAGENTA */) {
                    overlay = 0;
                    t2Colour = -2;
                    texture = -1;
                  } else {
                    t2Colour = ClientBuild.getTable(flo.hue, flo.saturation, flo.lightness);
                    overlay = Pix3D.colourTable[ClientBuild.getOCol(flo.overlayHsl, 96)];
                  }
                  world?.setGround(level, x0, z0, shape, rotation, texture, heightSW, heightSE, heightNE, heightNW, ClientBuild.getUCol(t1Colour, lightSW), ClientBuild.getUCol(t1Colour, lightSE), ClientBuild.getUCol(t1Colour, lightNE), ClientBuild.getUCol(t1Colour, lightNW), ClientBuild.getOCol(t2Colour, lightSW), ClientBuild.getOCol(t2Colour, lightSE), ClientBuild.getOCol(t2Colour, lightNE), ClientBuild.getOCol(t2Colour, lightNW), underlay, overlay);
                }
              }
            }
          }
        }
      }
      for (let stz = 1;stz < this.maxTileZ - 1; stz++) {
        for (let stx = 1;stx < this.maxTileX - 1; stx++) {
          world?.setLayer(level, stx, stz, this.getVisBelowLevel(level, stx, stz));
        }
      }
    }
    if (!ClientBuild.fullbright) {
      world?.shareLight(64, 768, -50, -10, -50);
    }
    for (let x = 0;x < this.maxTileX; x++) {
      for (let z = 0;z < this.maxTileZ; z++) {
        if ((this.mapl[1][x][z] & 2 /* LinkBelow */) !== 0) {
          world?.pushDown(x, z);
        }
      }
    }
    if (ClientBuild.fullbright) {
      return;
    }
    let wall0 = 1;
    let wall1 = 2;
    let floor = 4;
    for (let topLevel = 0;topLevel < 4 /* LEVELS */; topLevel++) {
      if (topLevel > 0) {
        wall0 <<= 3;
        wall1 <<= 3;
        floor <<= 3;
      }
      for (let level = 0;level <= topLevel; level++) {
        for (let tileZ = 0;tileZ <= this.maxTileZ; tileZ++) {
          for (let tileX = 0;tileX <= this.maxTileX; tileX++) {
            if ((this.mapo[level][tileX][tileZ] & wall0) !== 0) {
              let minTileZ = tileZ;
              let maxTileZ = tileZ;
              let minLevel = level;
              let maxLevel = level;
              while (minTileZ > 0 && (this.mapo[level][tileX][minTileZ - 1] & wall0) !== 0) {
                minTileZ--;
              }
              while (maxTileZ < this.maxTileZ && (this.mapo[level][tileX][maxTileZ + 1] & wall0) !== 0) {
                maxTileZ++;
              }
              find_min_level:
                while (minLevel > 0) {
                  for (let z = minTileZ;z <= maxTileZ; z++) {
                    if ((this.mapo[minLevel - 1][tileX][z] & wall0) === 0) {
                      break find_min_level;
                    }
                  }
                  minLevel--;
                }
              find_max_level:
                while (maxLevel < topLevel) {
                  for (let z = minTileZ;z <= maxTileZ; z++) {
                    if ((this.mapo[maxLevel + 1][tileX][z] & wall0) === 0) {
                      break find_max_level;
                    }
                  }
                  maxLevel++;
                }
              const area = (maxLevel + 1 - minLevel) * (maxTileZ + 1 - minTileZ);
              if (area >= 8) {
                const minY = this.groundh[maxLevel][tileX][minTileZ] - 240;
                const maxX = this.groundh[minLevel][tileX][minTileZ];
                World.setOcclude(topLevel, 1, tileX * 128, minY, minTileZ * 128, tileX * 128, maxX, maxTileZ * 128 + 128);
                for (let l = minLevel;l <= maxLevel; l++) {
                  for (let z = minTileZ;z <= maxTileZ; z++) {
                    this.mapo[l][tileX][z] &= ~wall0;
                  }
                }
              }
            }
            if ((this.mapo[level][tileX][tileZ] & wall1) !== 0) {
              let minTileX = tileX;
              let maxTileX = tileX;
              let minLevel = level;
              let maxLevel = level;
              while (minTileX > 0 && (this.mapo[level][minTileX - 1][tileZ] & wall1) !== 0) {
                minTileX--;
              }
              while (maxTileX < this.maxTileX && (this.mapo[level][maxTileX + 1][tileZ] & wall1) !== 0) {
                maxTileX++;
              }
              find_min_level2:
                while (minLevel > 0) {
                  for (let x = minTileX;x <= maxTileX; x++) {
                    if ((this.mapo[minLevel - 1][x][tileZ] & wall1) === 0) {
                      break find_min_level2;
                    }
                  }
                  minLevel--;
                }
              find_max_level2:
                while (maxLevel < topLevel) {
                  for (let x = minTileX;x <= maxTileX; x++) {
                    if ((this.mapo[maxLevel + 1][x][tileZ] & wall1) === 0) {
                      break find_max_level2;
                    }
                  }
                  maxLevel++;
                }
              const area = (maxLevel + 1 - minLevel) * (maxTileX + 1 - minTileX);
              if (area >= 8) {
                const minY = this.groundh[maxLevel][minTileX][tileZ] - 240;
                const maxY = this.groundh[minLevel][minTileX][tileZ];
                World.setOcclude(topLevel, 2, minTileX * 128, minY, tileZ * 128, maxTileX * 128 + 128, maxY, tileZ * 128);
                for (let l = minLevel;l <= maxLevel; l++) {
                  for (let x = minTileX;x <= maxTileX; x++) {
                    this.mapo[l][x][tileZ] &= ~wall1;
                  }
                }
              }
            }
            if ((this.mapo[level][tileX][tileZ] & floor) !== 0) {
              let minTileX = tileX;
              let maxTileX = tileX;
              let minTileZ = tileZ;
              let maxTileZ = tileZ;
              while (minTileZ > 0 && (this.mapo[level][tileX][minTileZ - 1] & floor) !== 0) {
                minTileZ--;
              }
              while (maxTileZ < this.maxTileZ && (this.mapo[level][tileX][maxTileZ + 1] & floor) !== 0) {
                maxTileZ++;
              }
              find_min_tile_xz:
                while (minTileX > 0) {
                  for (let z = minTileZ;z <= maxTileZ; z++) {
                    if ((this.mapo[level][minTileX - 1][z] & floor) === 0) {
                      break find_min_tile_xz;
                    }
                  }
                  minTileX--;
                }
              find_max_tile_xz:
                while (maxTileX < this.maxTileX) {
                  for (let z = minTileZ;z <= maxTileZ; z++) {
                    if ((this.mapo[level][maxTileX + 1][z] & floor) === 0) {
                      break find_max_tile_xz;
                    }
                  }
                  maxTileX++;
                }
              if ((maxTileX + 1 - minTileX) * (maxTileZ + 1 - minTileZ) >= 4) {
                const y = this.groundh[level][minTileX][minTileZ];
                World.setOcclude(topLevel, 4, minTileX * 128, y, minTileZ * 128, maxTileX * 128 + 128, y, maxTileZ * 128 + 128);
                for (let x = minTileX;x <= maxTileX; x++) {
                  for (let z = minTileZ;z <= maxTileZ; z++) {
                    this.mapo[level][x][z] &= ~floor;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  static perlinNoise(x, z) {
    let value = this.interpolatedNoise(x + 45365, z + 91923, 4) + (this.interpolatedNoise(x + 10294, z + 37821, 2) - 128 >> 1) + (this.interpolatedNoise(x, z, 1) - 128 >> 2) - 128;
    value = (value * 0.3 | 0) + 35;
    if (value < 10) {
      value = 10;
    } else if (value > 60) {
      value = 60;
    }
    return value;
  }
  static interpolatedNoise(x, z, scale) {
    const intX = x / scale | 0;
    const fracX = x & scale - 1;
    const intZ = z / scale | 0;
    const fracZ = z & scale - 1;
    const v1 = this.smoothNoise(intX, intZ);
    const v2 = this.smoothNoise(intX + 1, intZ);
    const v3 = this.smoothNoise(intX, intZ + 1);
    const v4 = this.smoothNoise(intX + 1, intZ + 1);
    const i1 = this.interpolate(v1, v2, fracX, scale);
    const i2 = this.interpolate(v3, v4, fracX, scale);
    return this.interpolate(i1, i2, fracZ, scale);
  }
  static interpolate(a, b, x, scale) {
    const f = 65536 - Pix3D.cosTable[x * 1024 / scale | 0] >> 1;
    return (a * (65536 - f) >> 16) + (b * f >> 16);
  }
  static smoothNoise(x, y) {
    const corners = this.noise(x - 1, y - 1) + this.noise(x + 1, y - 1) + this.noise(x - 1, y + 1) + this.noise(x + 1, y + 1);
    const sides = this.noise(x - 1, y) + this.noise(x + 1, y) + this.noise(x, y - 1) + this.noise(x, y + 1);
    const center = this.noise(x, y);
    return (corners / 16 | 0) + (sides / 8 | 0) + (center / 4 | 0);
  }
  static noise(x, y) {
    const n = x + y * 57;
    const n1 = BigInt(n << 13 ^ n);
    return Number((n1 * (n1 * n1 * 15731n + 789221n) + 1376312589n & 0x7fffffffn) >> 19n) & 255;
  }
  clearLandscape(startX, startZ, endX, endZ) {
    let waterOverlay = 0;
    for (let i = 0;i < FloType.numDefinitions; i++) {
      if (FloType.list[i].debugname?.toLowerCase() === "water") {
        waterOverlay = i + 1 << 24 >> 24;
        break;
      }
    }
    for (let z = startX;z < startX + endX; z++) {
      for (let x = startZ;x < startZ + endZ; x++) {
        if (x >= 0 && x < this.maxTileX && z >= 0 && z < this.maxTileZ) {
          this.floort2[0][x][z] = waterOverlay;
          for (let level = 0;level < 4 /* LEVELS */; level++) {
            this.groundh[level][x][z] = 0;
            this.mapl[level][x][z] = 0;
          }
        }
      }
    }
  }
  loadGround(originX, originZ, xOffset, zOffset, src) {
    const buf = new Packet(src);
    for (let level = 0;level < 4 /* LEVELS */; level++) {
      for (let x = 0;x < 64; x++) {
        for (let z = 0;z < 64; z++) {
          const stx = x + xOffset;
          const stz = z + zOffset;
          let opcode;
          if (stx >= 0 && stx < 104 /* SIZE */ && stz >= 0 && stz < 104 /* SIZE */) {
            this.mapl[level][stx][stz] = 0;
            while (true) {
              opcode = buf.g1();
              if (opcode === 0) {
                if (level === 0) {
                  this.groundh[0][stx][stz] = -ClientBuild.perlinNoise(stx + originX + 932731, stz + 556238 + originZ) * 8;
                } else {
                  this.groundh[level][stx][stz] = this.groundh[level - 1][stx][stz] - 240;
                }
                break;
              }
              if (opcode === 1) {
                let height = buf.g1();
                if (height === 1) {
                  height = 0;
                }
                if (level === 0) {
                  this.groundh[0][stx][stz] = -height * 8;
                } else {
                  this.groundh[level][stx][stz] = this.groundh[level - 1][stx][stz] - height * 8;
                }
                break;
              }
              if (opcode <= 49) {
                this.floort2[level][stx][stz] = buf.g1b();
                this.floors[level][stx][stz] = ((opcode - 2) / 4 | 0) << 24 >> 24;
                this.floorr[level][stx][stz] = (opcode - 2 & 3) << 24 >> 24;
              } else if (opcode <= 81) {
                this.mapl[level][stx][stz] = opcode - 49 << 24 >> 24;
              } else {
                this.floort1[level][stx][stz] = opcode - 81 << 24 >> 24;
              }
            }
          } else {
            while (true) {
              opcode = buf.g1();
              if (opcode === 0) {
                break;
              }
              if (opcode === 1) {
                buf.g1();
                break;
              }
              if (opcode <= 49) {
                buf.g1();
              }
            }
          }
        }
      }
    }
  }
  loadLocations(scene, locs, collisions, src, xOffset, zOffset) {
    const buf = new Packet(src);
    let locId = -1;
    while (true) {
      const deltaId = buf.gsmart();
      if (deltaId === 0) {
        return;
      }
      locId += deltaId;
      let locPos = 0;
      while (true) {
        const deltaPos = buf.gsmart();
        if (deltaPos === 0) {
          break;
        }
        locPos += deltaPos - 1;
        const z = locPos & 63;
        const x = locPos >> 6 & 63;
        const level = locPos >> 12;
        const info = buf.g1();
        const shape = info >> 2;
        const rotation = info & 3;
        const stx = x + xOffset;
        const stz = z + zOffset;
        if (stx > 0 && stz > 0 && stx < 104 /* SIZE */ - 1 && stz < 104 /* SIZE */ - 1) {
          let currentLevel = level;
          if ((this.mapl[1][stx][stz] & 2 /* LinkBelow */) !== 0) {
            currentLevel = level - 1;
          }
          let cmap = null;
          if (currentLevel >= 0) {
            cmap = collisions[currentLevel];
          }
          this.addLoc(level, stx, stz, scene, locs, cmap, locId, shape, rotation);
        }
      }
    }
  }
  addLoc(level, x, z, world, locs, cmap, locId, shape, angle) {
    if (ClientBuild.lowMem) {
      if ((this.mapl[level][x][z] & 16 /* ForceHighDetail */) !== 0) {
        return;
      }
      if (this.getVisBelowLevel(level, x, z) !== ClientBuild.minusedlevel) {
        return;
      }
    }
    const heightSW = this.groundh[level][x][z];
    const heightSE = this.groundh[level][x + 1][z];
    const heightNE = this.groundh[level][x + 1][z + 1];
    const heightNW = this.groundh[level][x][z + 1];
    const y = heightSW + heightSE + heightNE + heightNW >> 2;
    const loc = LocType.list(locId);
    let typecode = x + (z << 7) + (locId << 14) + 1073741824 | 0;
    if (!loc.active) {
      typecode += -2147483648;
    }
    typecode |= 0;
    const typecode2 = ((angle << 6) + shape | 0) << 24 >> 24;
    if (shape === 22 /* GROUND_DECOR */) {
      if (!ClientBuild.lowMem || loc.active || loc.forcedecor) {
        world?.setGroundDecor(loc.getModel(22 /* GROUND_DECOR */, angle, heightSW, heightSE, heightNE, heightNW, -1), level, x, z, y, typecode, typecode2);
        if (loc.blockwalk && loc.active && cmap) {
          cmap.blockGround(x, z);
        }
        if (loc.anim !== -1) {
          locs.push(new ClientLocAnim(locId, level, 3, x, z, SeqType.list[loc.anim], true));
        }
      }
    } else if (shape === 10 /* CENTREPIECE_STRAIGHT */ || shape === 11 /* CENTREPIECE_DIAGONAL */) {
      const model = loc.getModel(10 /* CENTREPIECE_STRAIGHT */, angle, heightSW, heightSE, heightNE, heightNW, -1);
      if (model) {
        let yaw = 0;
        if (shape === 11 /* CENTREPIECE_DIAGONAL */) {
          yaw += 256;
        }
        let width;
        let height;
        if (angle === 1 /* NORTH */ || angle === 3 /* SOUTH */) {
          width = loc.length;
          height = loc.width;
        } else {
          width = loc.width;
          height = loc.length;
        }
        if (world?.addScenery(level, x, z, y, model, null, typecode, typecode2, width, height, yaw) && loc.shadow) {
          for (let dx = 0;dx <= width; dx++) {
            for (let dz = 0;dz <= height; dz++) {
              let shade = model.radius / 4 | 0;
              if (shade > 30) {
                shade = 30;
              }
              if (shade > this.shadow[level][x + dx][z + dz]) {
                this.shadow[level][x + dx][z + dz] = shade << 24 >> 24;
              }
            }
          }
        }
      }
      if (loc.blockwalk && cmap) {
        cmap.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 2, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape >= 12 /* ROOF_STRAIGHT */) {
      world?.addScenery(level, x, z, y, loc.getModel(shape, angle, heightSW, heightSE, heightNE, heightNW, -1), null, typecode, typecode2, 1, 1, 0);
      if (shape >= 12 /* ROOF_STRAIGHT */ && shape <= 17 /* ROOF_FLAT */ && shape !== 13 /* ROOF_DIAGONAL_WITH_ROOFEDGE */ && level > 0) {
        this.mapo[level][x][z] |= 2340;
      }
      if (loc.blockwalk && cmap) {
        cmap.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 2, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 0 /* WALL_STRAIGHT */) {
      world?.setWall(level, x, z, y, ClientBuild.WSHAPE0[angle], 0, loc.getModel(0 /* WALL_STRAIGHT */, angle, heightSW, heightSE, heightNE, heightNW, -1), null, typecode, typecode2);
      if (angle === 0 /* WEST */) {
        if (loc.shadow) {
          this.shadow[level][x][z] = 50;
          this.shadow[level][x][z + 1] = 50;
        }
        if (loc.occlude) {
          this.mapo[level][x][z] |= 585;
        }
      } else if (angle === 1 /* NORTH */) {
        if (loc.shadow) {
          this.shadow[level][x][z + 1] = 50;
          this.shadow[level][x + 1][z + 1] = 50;
        }
        if (loc.occlude) {
          this.mapo[level][x][z + 1] |= 1170;
        }
      } else if (angle === 2 /* EAST */) {
        if (loc.shadow) {
          this.shadow[level][x + 1][z] = 50;
          this.shadow[level][x + 1][z + 1] = 50;
        }
        if (loc.occlude) {
          this.mapo[level][x + 1][z] |= 585;
        }
      } else if (angle === 3 /* SOUTH */) {
        if (loc.shadow) {
          this.shadow[level][x][z] = 50;
          this.shadow[level][x + 1][z] = 50;
        }
        if (loc.occlude) {
          this.mapo[level][x][z] |= 1170;
        }
      }
      if (loc.blockwalk && cmap) {
        cmap.addWall(x, z, shape, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 0, x, z, SeqType.list[loc.anim], true));
      }
      if (loc.wallwidth !== 16) {
        world?.moveDecor(level, x, z, loc.wallwidth);
      }
    } else if (shape === 1 /* WALL_DIAGONAL_CORNER */) {
      world?.setWall(level, x, z, y, ClientBuild.WSHAPE1[angle], 0, loc.getModel(1 /* WALL_DIAGONAL_CORNER */, angle, heightSW, heightSE, heightNE, heightNW, -1), null, typecode, typecode2);
      if (loc.shadow) {
        if (angle === 0 /* WEST */) {
          this.shadow[level][x][z + 1] = 50;
        } else if (angle === 1 /* NORTH */) {
          this.shadow[level][x + 1][z + 1] = 50;
        } else if (angle === 2 /* EAST */) {
          this.shadow[level][x + 1][z] = 50;
        } else if (angle === 3 /* SOUTH */) {
          this.shadow[level][x][z] = 50;
        }
      }
      if (loc.blockwalk && cmap) {
        cmap.addWall(x, z, shape, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 0, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 2 /* WALL_L */) {
      const offset = angle + 1 & 3;
      world?.setWall(level, x, z, y, ClientBuild.WSHAPE0[angle], ClientBuild.WSHAPE0[offset], loc.getModel(2 /* WALL_L */, angle + 4, heightSW, heightSE, heightNE, heightNW, -1), loc.getModel(2 /* WALL_L */, offset, heightSW, heightSE, heightNE, heightNW, -1), typecode, typecode2);
      if (loc.occlude) {
        if (angle === 0 /* WEST */) {
          this.mapo[level][x][z] |= 585;
          this.mapo[level][x][z + 1] |= 1170;
        } else if (angle === 1 /* NORTH */) {
          this.mapo[level][x][z + 1] |= 1170;
          this.mapo[level][x + 1][z] |= 585;
        } else if (angle === 2 /* EAST */) {
          this.mapo[level][x + 1][z] |= 585;
          this.mapo[level][x][z] |= 1170;
        } else if (angle === 3 /* SOUTH */) {
          this.mapo[level][x][z] |= 1170;
          this.mapo[level][x][z] |= 585;
        }
      }
      if (loc.blockwalk && cmap) {
        cmap.addWall(x, z, shape, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 0, x, z, SeqType.list[loc.anim], true));
      }
      if (loc.wallwidth !== 16) {
        world?.moveDecor(level, x, z, loc.wallwidth);
      }
    } else if (shape === 3 /* WALL_SQUARE_CORNER */) {
      world?.setWall(level, x, z, y, ClientBuild.WSHAPE1[angle], 0, loc.getModel(3 /* WALL_SQUARE_CORNER */, angle, heightSW, heightSE, heightNE, heightNW, -1), null, typecode, typecode2);
      if (loc.shadow) {
        if (angle === 0 /* WEST */) {
          this.shadow[level][x][z + 1] = 50;
        } else if (angle === 1 /* NORTH */) {
          this.shadow[level][x + 1][z + 1] = 50;
        } else if (angle === 2 /* EAST */) {
          this.shadow[level][x + 1][z] = 50;
        } else if (angle === 3 /* SOUTH */) {
          this.shadow[level][x][z] = 50;
        }
      }
      if (loc.blockwalk && cmap) {
        cmap.addWall(x, z, shape, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 0, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 9 /* WALL_DIAGONAL */) {
      world?.addScenery(level, x, z, y, loc.getModel(shape, angle, heightSW, heightSE, heightNE, heightNW, -1), null, typecode, typecode2, 1, 1, 0);
      if (loc.blockwalk && cmap) {
        cmap.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 2, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 4 /* WALLDECOR_STRAIGHT_NOOFFSET */) {
      world?.setDecor(level, x, z, y, 0, 0, typecode, loc.getModel(4 /* WALLDECOR_STRAIGHT_NOOFFSET */, 0 /* WEST */, heightSW, heightSE, heightNE, heightNW, -1), typecode2, angle * 512, ClientBuild.WSHAPE0[angle]);
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 1, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 5 /* WALLDECOR_STRAIGHT_OFFSET */) {
      let wallwidth = 16;
      if (world) {
        const typecode3 = world.wallType(level, x, z);
        if (typecode3 > 0) {
          wallwidth = LocType.list(typecode3 >> 14 & 32767).wallwidth;
        }
      }
      world?.setDecor(level, x, z, y, ClientBuild.DECORXOF[angle] * wallwidth, ClientBuild.DECORZOF[angle] * wallwidth, typecode, loc.getModel(4 /* WALLDECOR_STRAIGHT_NOOFFSET */, 0 /* WEST */, heightSW, heightSE, heightNE, heightNW, -1), typecode2, angle * 512, ClientBuild.WSHAPE0[angle]);
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 1, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 6 /* WALLDECOR_DIAGONAL_OFFSET */) {
      world?.setDecor(level, x, z, y, 0, 0, typecode, loc.getModel(4 /* WALLDECOR_STRAIGHT_NOOFFSET */, 0 /* WEST */, heightSW, heightSE, heightNE, heightNW, -1), typecode2, angle, 256);
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 1, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 7 /* WALLDECOR_DIAGONAL_NOOFFSET */) {
      world?.setDecor(level, x, z, y, 0, 0, typecode, loc.getModel(4 /* WALLDECOR_STRAIGHT_NOOFFSET */, 0 /* WEST */, heightSW, heightSE, heightNE, heightNW, -1), typecode2, angle, 512);
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 1, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 8 /* WALLDECOR_DIAGONAL_BOTH */) {
      world?.setDecor(level, x, z, y, 0, 0, typecode, loc.getModel(4 /* WALLDECOR_STRAIGHT_NOOFFSET */, 0 /* WEST */, heightSW, heightSE, heightNE, heightNW, -1), typecode2, angle, 768);
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 1, x, z, SeqType.list[loc.anim], true));
      }
    }
  }
  getVisBelowLevel(level, stx, stz) {
    if ((this.mapl[level][stx][stz] & 8 /* VisBelow */) === 0) {
      return level <= 0 || (this.mapl[1][stx][stz] & 2 /* LinkBelow */) === 0 ? level : level - 1;
    }
    return 0;
  }
  static getTable(hue, saturation, lightness) {
    if (lightness > 179) {
      saturation = saturation / 2 | 0;
    }
    if (lightness > 192) {
      saturation = saturation / 2 | 0;
    }
    if (lightness > 217) {
      saturation = saturation / 2 | 0;
    }
    if (lightness > 243) {
      saturation = saturation / 2 | 0;
    }
    return ((hue / 4 | 0) << 10) + ((saturation / 32 | 0) << 7) + (lightness / 2 | 0);
  }
  static changeLocUnchecked(level, x, z, world, levelHeightmap, locs, cmap, locId, shape, angle, trueLevel) {
    const heightSW = levelHeightmap[trueLevel][x][z];
    const heightSE = levelHeightmap[trueLevel][x + 1][z];
    const heightNW = levelHeightmap[trueLevel][x + 1][z + 1];
    const heightNE = levelHeightmap[trueLevel][x][z + 1];
    const y = heightSW + heightSE + heightNW + heightNE >> 2;
    const loc = LocType.list(locId);
    let typecode = x + (z << 7) + (locId << 14) + 1073741824 | 0;
    if (!loc.active) {
      typecode += -2147483648;
    }
    typecode |= 0;
    const typecode2 = ((angle << 6) + shape | 0) << 24 >> 24;
    if (shape === 22 /* GROUND_DECOR */) {
      world?.setGroundDecor(loc.getModel(22 /* GROUND_DECOR */, angle, heightSW, heightSE, heightNW, heightNE, -1), level, x, z, y, typecode, typecode2);
      if (loc.blockwalk && loc.active && cmap) {
        cmap.blockGround(x, z);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 3, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 10 /* CENTREPIECE_STRAIGHT */ || shape === 11 /* CENTREPIECE_DIAGONAL */) {
      const model = loc.getModel(10 /* CENTREPIECE_STRAIGHT */, angle, heightSW, heightSE, heightNW, heightNE, -1);
      if (model) {
        let yaw = 0;
        if (shape === 11 /* CENTREPIECE_DIAGONAL */) {
          yaw += 256;
        }
        let width;
        let height;
        if (angle === 1 /* NORTH */ || angle === 3 /* SOUTH */) {
          width = loc.length;
          height = loc.width;
        } else {
          width = loc.width;
          height = loc.length;
        }
        world?.addScenery(level, x, z, y, model, null, typecode, typecode2, width, height, yaw);
      }
      if (loc.blockwalk && cmap) {
        cmap.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 2, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape >= 12 /* ROOF_STRAIGHT */) {
      world?.addScenery(level, x, z, y, loc.getModel(shape, angle, heightSW, heightSE, heightNW, heightNE, -1), null, typecode, typecode2, 1, 1, 0);
      if (loc.blockwalk && cmap) {
        cmap.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 2, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 0 /* WALL_STRAIGHT */) {
      world?.setWall(level, x, z, y, ClientBuild.WSHAPE0[angle], 0, loc.getModel(0 /* WALL_STRAIGHT */, angle, heightSW, heightSE, heightNW, heightNE, -1), null, typecode, typecode2);
      if (loc.blockwalk && cmap) {
        cmap.addWall(x, z, shape, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 0, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 1 /* WALL_DIAGONAL_CORNER */) {
      world?.setWall(level, x, z, y, ClientBuild.WSHAPE1[angle], 0, loc.getModel(1 /* WALL_DIAGONAL_CORNER */, angle, heightSW, heightSE, heightNW, heightNE, -1), null, typecode, typecode2);
      if (loc.blockwalk && cmap) {
        cmap.addWall(x, z, shape, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 0, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 2 /* WALL_L */) {
      const offset = angle + 1 & 3;
      world?.setWall(level, x, z, y, ClientBuild.WSHAPE0[angle], ClientBuild.WSHAPE0[offset], loc.getModel(2 /* WALL_L */, angle + 4, heightSW, heightSE, heightNW, heightNE, -1), loc.getModel(2 /* WALL_L */, offset, heightSW, heightSE, heightNW, heightNE, -1), typecode, typecode2);
      if (loc.blockwalk && cmap) {
        cmap.addWall(x, z, shape, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 0, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 3 /* WALL_SQUARE_CORNER */) {
      world?.setWall(level, x, z, y, ClientBuild.WSHAPE1[angle], 0, loc.getModel(3 /* WALL_SQUARE_CORNER */, angle, heightSW, heightSE, heightNW, heightNE, -1), null, typecode, typecode2);
      if (loc.blockwalk && cmap) {
        cmap.addWall(x, z, shape, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 0, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 9 /* WALL_DIAGONAL */) {
      world?.addScenery(level, x, z, y, loc.getModel(shape, angle, heightSW, heightSE, heightNW, heightNE, -1), null, typecode, typecode2, 1, 1, 0);
      if (loc.blockwalk && cmap) {
        cmap.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
      }
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 2, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 4 /* WALLDECOR_STRAIGHT_NOOFFSET */) {
      world?.setDecor(level, x, z, y, 0, 0, typecode, loc.getModel(4 /* WALLDECOR_STRAIGHT_NOOFFSET */, 0 /* WEST */, heightSW, heightSE, heightNW, heightNE, -1), typecode2, angle * 512, ClientBuild.WSHAPE0[angle]);
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 1, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 5 /* WALLDECOR_STRAIGHT_OFFSET */) {
      let wallwidth = 16;
      if (world) {
        const typecode3 = world.wallType(level, x, z);
        if (typecode3 > 0) {
          wallwidth = LocType.list(typecode3 >> 14 & 32767).wallwidth;
        }
      }
      world?.setDecor(level, x, z, y, ClientBuild.DECORXOF[angle] * wallwidth, ClientBuild.DECORZOF[angle] * wallwidth, typecode, loc.getModel(4 /* WALLDECOR_STRAIGHT_NOOFFSET */, 0 /* WEST */, heightSW, heightSE, heightNW, heightNE, -1), typecode2, angle * 512, ClientBuild.WSHAPE0[angle]);
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 1, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 6 /* WALLDECOR_DIAGONAL_OFFSET */) {
      world?.setDecor(level, x, z, y, 0, 0, typecode, loc.getModel(4 /* WALLDECOR_STRAIGHT_NOOFFSET */, 0 /* WEST */, heightSW, heightSE, heightNW, heightNE, -1), typecode2, angle, 256);
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 1, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 7 /* WALLDECOR_DIAGONAL_NOOFFSET */) {
      world?.setDecor(level, x, z, y, 0, 0, typecode, loc.getModel(4 /* WALLDECOR_STRAIGHT_NOOFFSET */, 0 /* WEST */, heightSW, heightSE, heightNW, heightNE, -1), typecode2, angle, 512);
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 1, x, z, SeqType.list[loc.anim], true));
      }
    } else if (shape === 8 /* WALLDECOR_DIAGONAL_BOTH */) {
      world?.setDecor(level, x, z, y, 0, 0, typecode, loc.getModel(4 /* WALLDECOR_STRAIGHT_NOOFFSET */, 0 /* WEST */, heightSW, heightSE, heightNW, heightNE, -1), typecode2, angle, 768);
      if (loc.anim !== -1) {
        locs.push(new ClientLocAnim(locId, level, 1, x, z, SeqType.list[loc.anim], true));
      }
    }
  }
  static getUCol(hsl, lightness) {
    if (hsl === -1) {
      return 12345678;
    }
    lightness = lightness * (hsl & 127) / 128 | 0;
    if (lightness < 2) {
      lightness = 2;
    } else if (lightness > 126) {
      lightness = 126;
    }
    return (hsl & 65408) + lightness;
  }
  static getOCol(hsl, scalar) {
    if (hsl === -2) {
      return 12345678;
    }
    if (hsl === -1) {
      if (scalar < 0) {
        scalar = 0;
      } else if (scalar > 127) {
        scalar = 127;
      }
      return 127 - scalar;
    } else {
      scalar = scalar * (hsl & 127) / 128 | 0;
      if (scalar < 2) {
        scalar = 2;
      } else if (scalar > 126) {
        scalar = 126;
      }
      return (hsl & 65408) + scalar;
    }
  }
}

// src/client/HouseBlueprint.ts
var ESCAPE = 16;
var ROOF_SCAN = 48;
var LEVEL_HEIGHT_RS = 240;
function edgeKey(ax, az, bx, bz) {
  if (ax < bx || ax === bx && az < bz) {
    return `${ax},${az}>${bx},${bz}`;
  }
  return `${bx},${bz}>${ax},${az}`;
}
function isWallShape(shape) {
  return shape <= 3 || shape === 9;
}
function isWallDecor(shape) {
  return shape >= 4 && shape <= 8;
}
function isRoofShape(shape) {
  return shape >= 12 && shape <= 21;
}
function padTiles(tiles, pad) {
  const seen = new Set;
  const out = [];
  for (const t of tiles) {
    for (let dx = -pad;dx <= pad; dx++) {
      for (let dz = -pad;dz <= pad; dz++) {
        const x = t.x + dx;
        const z = t.z + dz;
        const key = `${x},${z}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        out.push({ x, z });
      }
    }
  }
  out.sort((a, b) => a.z - b.z || a.x - b.x);
  return out;
}
function isListedRoof(loc, level) {
  if (loc.type !== 1933 || loc.level !== level) {
    return false;
  }
  if (level === 1) {
    return loc.shape === 12 || loc.shape === 13 || loc.shape === 14 || loc.shape === 16 || loc.shape === 17;
  }
  if (level === 3) {
    return loc.shape === 12 || loc.shape === 13 || loc.shape === 16 || loc.shape === 17;
  }
  return false;
}
function isGuideHousePad(x, z) {
  return x >= 3086 && x <= 3098 && z >= 3099 && z <= 3113;
}
function isGuideRoofEdge(x, z, floodKeys) {
  if (!floodKeys.has(`${x},${z}`)) {
    return false;
  }
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  return dirs.some(([dx, dz]) => !floodKeys.has(`${x + dx},${z + dz}`));
}
function shutterInto(angle) {
  switch (angle % 4) {
    case 0:
      return [-1, 0];
    case 1:
      return [0, 1];
    case 2:
      return [1, 0];
    default:
      return [0, -1];
  }
}
function shutterAxisMatch(shutterAngle, wallAngle) {
  return shutterAngle % 2 === wallAngle % 2;
}
function findShutterWall(loc, walls) {
  const [dx, dz] = shutterInto(loc.angle);
  return walls.find((w) => w.x === loc.x && w.z === loc.z && w.level === loc.level) ?? walls.find((w) => w.x === loc.x + dx && w.z === loc.z + dz && w.level === loc.level);
}
function nearbyShutterTiles(loc, pair) {
  const tiles = [[loc.x, loc.z]];
  const [dx, dz] = shutterInto(loc.angle);
  tiles.push([loc.x + dx, loc.z + dz]);
  if (pair) {
    tiles.push([pair.x, pair.z]);
    const [pdx, pdz] = shutterInto(pair.angle);
    tiles.push([pair.x + pdx, pair.z + pdz]);
  }
  return tiles;
}
function findShutterLeaves(loc, walls, pair) {
  const tiles = new Set(nearbyShutterTiles(loc, pair).map(([x, z]) => `${x},${z}`));
  return walls.filter((w) => w.level === loc.level && tiles.has(`${w.x},${w.z}`) && shutterAxisMatch(loc.angle, w.angle));
}
function findShutterSkip(loc, walls) {
  return walls.filter((w) => w.x === loc.x && w.z === loc.z && w.level === loc.level && !shutterAxisMatch(loc.angle, w.angle));
}
function findShutterPair(loc, all) {
  const opp = (loc.angle + 2) % 4;
  const same = all.find((s) => s !== loc && s.x === loc.x && s.z === loc.z && s.level === loc.level && s.angle % 4 === opp);
  if (same) {
    return same;
  }
  const [dx, dz] = shutterInto(loc.angle);
  return all.find((s) => s.x === loc.x + dx && s.z === loc.z + dz && s.level === loc.level && s.angle % 4 === opp);
}
function remapGuideRoofShape(loc, floodKeys) {
  if (loc.type !== 1933 || !isRoofShape(loc.shape) || !isGuideHousePad(loc.x, loc.z)) {
    return loc.shape;
  }
  if (loc.shape === 13) {
    return 12;
  }
  if (isGuideRoofEdge(loc.x, loc.z, floodKeys)) {
    return loc.shape === 16 ? 12 : loc.shape;
  }
  if (floodKeys.has(`${loc.x},${loc.z}`)) {
    return 17;
  }
  return loc.shape;
}
function fullEdges(x, z, shape, angle) {
  if (shape === 1 || shape === 3) {
    return [];
  }
  const a = angle % 4;
  if (shape === 2) {
    if (a === 0) {
      return [
        [x, z, x - 1, z],
        [x, z, x, z + 1]
      ];
    }
    if (a === 1) {
      return [
        [x, z, x, z + 1],
        [x, z, x + 1, z]
      ];
    }
    if (a === 2) {
      return [
        [x, z, x + 1, z],
        [x, z, x, z - 1]
      ];
    }
    return [
      [x, z, x, z - 1],
      [x, z, x - 1, z]
    ];
  }
  if (a === 0) {
    return [[x, z, x - 1, z]];
  }
  if (a === 1) {
    return [[x, z, x, z + 1]];
  }
  if (a === 2) {
    return [[x, z, x + 1, z]];
  }
  return [[x, z, x, z - 1]];
}
function locInfo(typecode, info) {
  return {
    type: typecode >> 14 & 32767,
    shape: info & 31,
    angle: info >> 6 & 3
  };
}
function visitTileLocs(world, level, lx, lz, fn) {
  const tile = world.squareAt(level, lx, lz);
  if (!tile) {
    return;
  }
  if (tile.wall) {
    fn("wall", tile.wall.typecode, tile.wall.typecode2 & 255);
  }
  if (tile.decor) {
    fn("decor", tile.decor.typecode, tile.decor.typecode2 & 255);
  }
  if (tile.groundDecor) {
    fn("gdecor", tile.groundDecor.typecode, tile.groundDecor.typecode2 & 255);
  }
  for (let i = 0;i < tile.spriteCount; i++) {
    const sprite = tile.sprites[i];
    if (!sprite || sprite.minTileX !== lx || sprite.minTileZ !== lz) {
      continue;
    }
    if ((sprite.typecode >> 29 & 3) !== 2) {
      continue;
    }
    fn("scenery", sprite.typecode, sprite.typecode2 & 255);
  }
}
function addCollisionEdges(edges, cmap, baseX, baseZ) {
  if (!cmap) {
    return;
  }
  for (let lz = 0;lz < 104 /* SIZE */; lz++) {
    for (let lx = 0;lx < 104 /* SIZE */; lx++) {
      const flags = cmap.flags[CollisionMap.index(lx, lz)];
      const wx = baseX + lx;
      const wz = baseZ + lz;
      if ((flags & 128 /* W_W */) !== 0) {
        edges.add(edgeKey(wx, wz, wx - 1, wz));
      }
      if ((flags & 8 /* W_E */) !== 0) {
        edges.add(edgeKey(wx, wz, wx + 1, wz));
      }
      if ((flags & 2 /* W_N */) !== 0) {
        edges.add(edgeKey(wx, wz, wx, wz + 1));
      }
      if ((flags & 32 /* W_S */) !== 0) {
        edges.add(edgeKey(wx, wz, wx, wz - 1));
      }
    }
  }
}
function isWalkableFlags(flags) {
  return (flags & 2621696 /* SQ_BLOCKED */) === 0;
}
function decodeBlockDirs(flags) {
  let out = "";
  if ((flags & 2 /* W_N */) !== 0) {
    out += "N";
  }
  if ((flags & 8 /* W_E */) !== 0) {
    out += "E";
  }
  if ((flags & 32 /* W_S */) !== 0) {
    out += "S";
  }
  if ((flags & 128 /* W_W */) !== 0) {
    out += "W";
  }
  return out.length > 0 ? out : "none";
}
function edgeTouchesFlood(key, floodKeys) {
  const parts = key.split(">");
  if (parts.length !== 2) {
    return false;
  }
  return parts.some((part) => floodKeys.has(part));
}
function appendWalkClipSections(lines, args) {
  const { baseX, baseZ, tiles, collision } = args;
  const floodKeys = new Set(tiles.map((t) => `${t.x},${t.z}`));
  const walkCounts = [];
  lines.push("WALK");
  lines.push("CollisionMap walkable floors over FLOOR flood tiles for levels 0-3; walk=yes when (flags & SQ_BLOCKED)==0");
  for (let lvl = 0;lvl < 4 /* LEVELS */; lvl++) {
    const cmap = collision[lvl] ?? null;
    let walkable = 0;
    for (const t of tiles) {
      const lx = t.x - baseX;
      const lz = t.z - baseZ;
      if (lx < 0 || lz < 0 || lx >= 104 /* SIZE */ || lz >= 104 /* SIZE */) {
        continue;
      }
      const flags = cmap ? cmap.flags[CollisionMap.index(lx, lz)] : 16777216 /* UNLOADED */;
      const walk = isWalkableFlags(flags);
      if (walk) {
        walkable++;
      }
      lines.push(`tile ${t.x},${t.z} level=${lvl} flags=${flags} walk=${walk ? "yes" : "no"} block=${decodeBlockDirs(flags)} sq=${walk ? "open" : "blocked"}`);
    }
    walkCounts.push(walkable);
  }
  lines.push("");
  lines.push("CLIP");
  lines.push("CollisionMap W_N/E/S/W edges touching FLOOR flood; compare to VR EDGES LIVE / story edges");
  let clipAny = false;
  for (let lvl = 0;lvl < 4 /* LEVELS */; lvl++) {
    const edges = new Set;
    addCollisionEdges(edges, collision[lvl] ?? null, baseX, baseZ);
    const filtered = [...edges].filter((key) => edgeTouchesFlood(key, floodKeys));
    filtered.sort();
    for (const key of filtered) {
      clipAny = true;
      lines.push(`edge ${key} level=${lvl}`);
    }
  }
  if (!clipAny) {
    lines.push("(none)");
  }
  return walkCounts;
}
function locTypeOf(type) {
  try {
    return LocType.list(type);
  } catch {
    return null;
  }
}
function occupyFootprint(occupied, wx, wz, shape, angle, loc) {
  if (isWallDecor(shape) || shape === 9) {
    occupied.add(`${wx},${wz}`);
    return;
  }
  if (shape !== 10 && shape !== 11) {
    return;
  }
  if (!loc || !loc.blockwalk) {
    return;
  }
  let width = loc.width;
  let length = loc.length;
  if (angle === 1 || angle === 3) {
    const tmp = width;
    width = length;
    length = tmp;
  }
  for (let dx = 0;dx < width; dx++) {
    for (let dz = 0;dz < length; dz++) {
      occupied.add(`${wx + dx},${wz + dz}`);
    }
  }
}
function collectEdges(world, baseX, baseZ, level, collision) {
  const edges = new Set;
  const occupied = new Set;
  for (let lz = 0;lz < 104 /* SIZE */; lz++) {
    for (let lx = 0;lx < 104 /* SIZE */; lx++) {
      visitTileLocs(world, level, lx, lz, (_kind, typecode, info) => {
        const { type, shape, angle } = locInfo(typecode, info);
        const wx = baseX + lx;
        const wz = baseZ + lz;
        occupyFootprint(occupied, wx, wz, shape, angle, locTypeOf(type));
        const edgeShape = isWallDecor(shape) ? 0 : shape;
        if (!isWallDecor(shape) && !isWallShape(shape)) {
          return;
        }
        for (const [ax, az, bx, bz] of fullEdges(wx, wz, edgeShape, angle)) {
          edges.add(edgeKey(ax, az, bx, bz));
        }
      });
    }
  }
  addCollisionEdges(edges, collision, baseX, baseZ);
  return { edges, occupied };
}
function blocked(edges, x, z, nx, nz) {
  return edges.has(edgeKey(x, z, nx, nz));
}
function floodHouse(world, baseX, baseZ, wx, wz, level, collision = null) {
  const { edges, occupied } = collectEdges(world, baseX, baseZ, level, collision);
  const startLx = wx - baseX;
  const startLz = wz - baseZ;
  if (startLx < 0 || startLz < 0 || startLx >= 104 /* SIZE */ || startLz >= 104 /* SIZE */) {
    return { inside: false, tiles: [], reason: "off-map" };
  }
  const seen = new Set;
  const queue = [{ x: wx, z: wz }];
  seen.add(`${wx},${wz}`);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  while (queue.length > 0) {
    const cur = queue.pop();
    if (Math.max(Math.abs(cur.x - wx), Math.abs(cur.z - wz)) > ESCAPE) {
      return { inside: false, tiles: [], reason: "escaped" };
    }
    for (const [dx, dz] of dirs) {
      const nx = cur.x + dx;
      const nz = cur.z + dz;
      if (blocked(edges, cur.x, cur.z, nx, nz)) {
        continue;
      }
      const key = `${nx},${nz}`;
      if (occupied.has(key)) {
        seen.add(key);
        continue;
      }
      const lx = nx - baseX;
      const lz = nz - baseZ;
      if (lx < 0 || lz < 0 || lx >= 104 /* SIZE */ || lz >= 104 /* SIZE */) {
        return { inside: false, tiles: [], reason: "map-edge" };
      }
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      queue.push({ x: nx, z: nz });
    }
  }
  const tiles = [...seen].map((key) => {
    const [x, z] = key.split(",").map(Number);
    return { x, z };
  });
  tiles.sort((a, b) => a.z - b.z || a.x - b.x);
  if (tiles.length < 2) {
    return { inside: false, tiles: [], reason: "too-small" };
  }
  return { inside: true, tiles, reason: "enclosed" };
}
function modelForShape(loc, shape) {
  const lookup = shape >= 5 && shape <= 8 ? 4 : shape === 11 ? 10 : shape;
  const models = loc.model;
  const shapes = loc.shape;
  if (!models) {
    return -1;
  }
  if (shapes) {
    for (let i = 0;i < models.length; i++) {
      if (i < shapes.length && shapes[i] === lookup) {
        return models[i];
      }
    }
  }
  if (isWallShape(shape) && models.length > 0) {
    return models[0];
  }
  return -1;
}
function modelBits(modelId) {
  if (modelId < 0 || !Model.meta[modelId]) {
    return { hasalpha: false, tex: [] };
  }
  try {
    const model = Model.load(modelId);
    let hasalpha = false;
    if (model.faceAlpha) {
      for (let f = 0;f < model.numFaces; f++) {
        if (model.faceAlpha[f] > 0) {
          hasalpha = true;
          break;
        }
      }
    }
    const tex = new Set;
    for (let f = 0;f < model.numFaces; f++) {
      const info = model.faceRenderType ? model.faceRenderType[f] : 0;
      if ((info & 2) !== 2) {
        continue;
      }
      const id = model.faceColour ? model.faceColour[f] : -1;
      if (id >= 0 && id <= 49) {
        tex.add(id);
      }
    }
    return { hasalpha, tex: [...tex].sort((a, b) => a - b) };
  } catch {
    return { hasalpha: false, tex: [] };
  }
}
function describeLoc(kind, typecode, info, level, wx, wz) {
  const { type, shape, angle } = locInfo(typecode, info);
  let loc = null;
  try {
    loc = LocType.list(type);
  } catch {
    loc = null;
  }
  if (!loc) {
    return null;
  }
  const modelId = modelForShape(loc, shape);
  const bits = modelBits(modelId);
  return {
    kind,
    type,
    name: loc.name ?? "",
    shape,
    angle,
    level,
    x: wx,
    z: wz,
    width: loc.width,
    length: loc.length,
    wallwidth: loc.wallwidth,
    resizex: loc.resizex,
    resizey: loc.resizey,
    resizez: loc.resizez,
    offsetx: loc.offsetx,
    offsety: loc.offsety,
    offsetz: loc.offsetz,
    models: loc.model ? [...loc.model] : [],
    shapes: loc.shape ? [...loc.shape] : [],
    modelId,
    hasalpha: loc.animateTransparencies || bits.hasalpha,
    tex: bits.tex,
    blockwalk: loc.blockwalk,
    occlude: loc.occlude,
    hillskew: loc.hillskew
  };
}
function collectHouseLocs(world, baseX, baseZ, tiles, level, roofsOnly) {
  const out = [];
  for (const tile of tiles) {
    const lx = tile.x - baseX;
    const lz = tile.z - baseZ;
    if (lx < 0 || lz < 0 || lx >= 104 /* SIZE */ || lz >= 104 /* SIZE */) {
      continue;
    }
    visitTileLocs(world, level, lx, lz, (kind, typecode, info) => {
      const loc = describeLoc(kind, typecode, info, level, tile.x, tile.z);
      if (!loc) {
        return;
      }
      if (roofsOnly && !isRoofShape(loc.shape)) {
        return;
      }
      out.push(loc);
    });
  }
  out.sort((a, b) => a.z - b.z || a.x - b.x || a.type - b.type);
  return out;
}
function heightAt(groundh, level, lx, lz) {
  const h = groundh?.[level];
  if (!h) {
    return [0, 0, 0, 0];
  }
  return [h[lx]?.[lz] ?? 0, h[lx + 1]?.[lz] ?? 0, h[lx]?.[lz + 1] ?? 0, h[lx + 1]?.[lz + 1] ?? 0];
}
function avgHeightM(h) {
  return (h[0] + h[1] + h[2] + h[3]) / 4 / 128;
}
function locLine(loc, yM) {
  return `loc kind=${loc.kind} type=${loc.type} name=${loc.name} shape=${loc.shape} angle=${loc.angle} level=${loc.level} at ${loc.x},${loc.z}` + ` size=${loc.width}x${loc.length} wallwidth=${loc.wallwidth}` + ` scale=${loc.resizex},${loc.resizey},${loc.resizez} offset=${loc.offsetx},${loc.offsety},${loc.offsetz}` + ` model=${loc.modelId} models=${loc.models.join(",") || "-"} shapes=${loc.shapes.join(",") || "-"}` + ` hasalpha=${loc.hasalpha ? "yes" : "no"} tex=${loc.tex.join(",") || "-"}` + ` blockwalk=${loc.blockwalk ? "yes" : "no"} occlude=${loc.occlude ? "yes" : "no"} hillskew=${loc.hillskew ? "yes" : "no"}` + ` y=${yM.toFixed(3)}`;
}
function buildHouseText(args) {
  const lines = [];
  const { fill, wx, wz, level, baseX, baseZ } = args;
  lines.push(`HOUSE inside=${fill.inside ? "yes" : "no"} floor=${level} tiles=${fill.tiles.length} reason=${fill.reason} player=${wx},${wz}`);
  if (!fill.inside) {
    lines.push("not inside a house");
    lines.push("");
    lines.push("VR");
    lines.push("do not invent locs");
    return `${lines.join(`
`)}
`;
  }
  let minX = wx;
  let maxX = wx;
  let minZ = wz;
  let maxZ = wz;
  for (const t of fill.tiles) {
    minX = Math.min(minX, t.x);
    maxX = Math.max(maxX, t.x);
    minZ = Math.min(minZ, t.z);
    maxZ = Math.max(maxZ, t.z);
  }
  lines.push(`HOUSE aabb=${minX},${minZ}..${maxX},${maxZ}`);
  lines.push("");
  lines.push("FLOOR");
  for (const t of fill.tiles) {
    const lx = t.x - baseX;
    const lz = t.z - baseZ;
    const h = heightAt(args.groundh, level, lx, lz);
    const cmap = args.collision[level];
    const flags = cmap ? cmap.flags[CollisionMap.index(lx, lz)] : 0;
    let ov = -1;
    let und = -1;
    let packed = -1;
    let rot = -1;
    if (args.build) {
      und = args.build.underlayAt(level, lx, lz);
      ov = args.build.overlayAt(level, lx, lz);
      packed = args.build.overlayShapeAt(level, lx, lz);
      rot = args.build.overlayRotAt(level, lx, lz);
    }
    lines.push(`tile ${t.x},${t.z} lx=${lx},${lz} ov=${ov} packed=${packed} rot=${rot} und=${und} flags=${flags} h=(${h[0]},${h[1]},${h[2]},${h[3]}) y=${avgHeightM(h).toFixed(3)}`);
  }
  lines.push("");
  appendWalkClipSections(lines, {
    baseX,
    baseZ,
    tiles: fill.tiles,
    collision: args.collision
  });
  lines.push("");
  lines.push("LOCS");
  const locs = args.world ? collectHouseLocs(args.world, baseX, baseZ, fill.tiles, level, false) : [];
  if (locs.length === 0) {
    lines.push("(none)");
  } else {
    for (const loc of locs) {
      const h = heightAt(args.groundh, loc.level, loc.x - baseX, loc.z - baseZ);
      lines.push(locLine(loc, avgHeightM(h)));
    }
  }
  lines.push("");
  const roofTiles = padTiles(fill.tiles, 1);
  const roofY = (loc) => {
    const h0 = heightAt(args.groundh, 0, loc.x - baseX, loc.z - baseZ);
    const h1 = [
      h0[0] + LEVEL_HEIGHT_RS,
      h0[1] + LEVEL_HEIGHT_RS,
      h0[2] + LEVEL_HEIGHT_RS,
      h0[3] + LEVEL_HEIGHT_RS
    ];
    return avgHeightM(h1);
  };
  const writeRoofBlock = (title, roofs) => {
    lines.push(title);
    if (roofs.length === 0) {
      lines.push("2004 gap — do not invent");
      return;
    }
    lines.push("VR show L1 roofs at dump Y; hide L3 while L1 walls are hidden; do not flatten");
    for (const loc of roofs) {
      const onFloor = floodKeys.has(`${loc.x},${loc.z}`);
      const hide = loc.level >= 3 ? " hide=L3" : loc.shape === 16 && !onFloor ? " hide=gable" : " spawn=dumpY";
      lines.push(`${locLine(loc, roofY(loc))} material=2004-loc-${loc.type} placement=tile ${loc.x},${loc.z} level=${loc.level}${hide}`);
    }
  };
  const floodKeys = new Set(fill.tiles.map((t) => `${t.x},${t.z}`));
  const l1Roofs = args.world ? collectHouseLocs(args.world, baseX, baseZ, roofTiles, 1, true).filter((loc) => isListedRoof(loc, 1)) : [];
  const l3Roofs = args.world ? collectHouseLocs(args.world, baseX, baseZ, roofTiles, 3, true).filter((loc) => isListedRoof(loc, 3)) : [];
  writeRoofBlock("ROOF L1", l1Roofs);
  lines.push("");
  writeRoofBlock("ROOF L3", l3Roofs);
  const cover17 = new Set;
  for (const loc of [...l1Roofs, ...l3Roofs]) {
    if (remapGuideRoofShape(loc, floodKeys) === 17) {
      cover17.add(`${loc.x},${loc.z}`);
    }
  }
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  const edgeTiles = fill.tiles.filter((t) => dirs.some(([dx, dz]) => !floodKeys.has(`${t.x + dx},${t.z + dz}`)));
  const gapTiles = fill.tiles.filter((t) => !cover17.has(`${t.x},${t.z}`));
  const pad13 = [...l1Roofs, ...l3Roofs].filter((loc) => loc.shape === 13 && isGuideHousePad(loc.x, loc.z));
  lines.push("");
  lines.push("EDGE");
  lines.push("flood tiles with a 4-neighbor outside the house; VR keep 12/14 here");
  if (edgeTiles.length === 0) {
    lines.push("(none)");
  } else {
    for (const t of edgeTiles) {
      lines.push(`tile ${t.x},${t.z}`);
    }
  }
  lines.push("");
  lines.push("GAPS");
  lines.push("flood tiles with no 1933 shape 17 — 2004 gap, do not invent; do not flatten");
  if (gapTiles.length === 0) {
    lines.push("(none)");
  } else {
    for (const t of gapTiles) {
      lines.push(`tile ${t.x},${t.z}`);
    }
  }
  lines.push("");
  lines.push("PAD13");
  lines.push("pad 1933 shape 13; VR remap 13→12");
  if (pad13.length === 0) {
    lines.push("(none)");
  } else {
    for (const loc of pad13) {
      lines.push(`tile ${loc.x},${loc.z} level=${loc.level}`);
    }
  }
  lines.push("");
  const l0Pad = args.world ? collectHouseLocs(args.world, baseX, baseZ, roofTiles, 0, false) : [];
  const shutterLocs = l0Pad.filter((loc) => loc.type === 1838);
  const wall1902 = l0Pad.filter((loc) => loc.type === 1902);
  lines.push("SHUTTERS");
  lines.push("VR punch 1902 through both faces");
  if (shutterLocs.length === 0) {
    lines.push("(none)");
  } else {
    for (const loc of shutterLocs) {
      const side = floodKeys.has(`${loc.x},${loc.z}`) ? "in" : "out";
      const wall = findShutterWall(loc, wall1902);
      const pair = findShutterPair(loc, shutterLocs);
      const leaves = findShutterLeaves(loc, wall1902, pair);
      const skip = findShutterSkip(loc, wall1902);
      const match = wall ? shutterAxisMatch(loc.angle, wall.angle) ? "yes" : "no" : "no";
      const wallBit = wall ? ` wall=${wall.x},${wall.z}` : "";
      const wallangBit = wall ? ` wallang=${wall.angle}` : "";
      const leavesBit = leaves.length > 0 ? ` leaves=${leaves.map((w) => `${w.x},${w.z}`).join("|")}` : " leaves=-";
      const skipBit = skip.length > 0 ? ` skip=${skip.map((w) => `${w.x},${w.z}`).join("|")}` : " skip=-";
      const pairBit = pair ? ` pair=${pair.x},${pair.z}` : "";
      lines.push(`tile ${loc.x},${loc.z} shape=${loc.shape} angle=${loc.angle} side=${side}${wallBit}${wallangBit} match=${match}${leavesBit}${skipBit}${pairBit}`);
    }
  }
  lines.push("");
  lines.push("VR");
  lines.push("compare this folder to a VR F12 dump");
  lines.push("compare CLIP to VR EDGES LIVE / story edges");
  lines.push("keep cook-east overlay 22");
  lines.push("walk uses _edges (shape 0/9/4-8 one side, 1/3 none, 2 both) plus occupy 9/10/11/walldecor");
  lines.push("do not invent locs");
  lines.push("do not write loc-edits.json from this dump");
  return `${lines.join(`
`)}
`;
}
function chebyshev(ax, az, bx, bz) {
  return Math.max(Math.abs(ax - bx), Math.abs(az - bz));
}
function scanRoofLocs(world, baseX, baseZ, wx, wz, radius) {
  const tiles = [];
  for (let z = wz - radius;z <= wz + radius; z++) {
    for (let x = wx - radius;x <= wx + radius; x++) {
      tiles.push({ x, z });
    }
  }
  const out = [];
  for (let level = 0;level < 4 /* LEVELS */; level++) {
    out.push(...collectHouseLocs(world, baseX, baseZ, tiles, level, true));
  }
  return out;
}
function clusterRoofTiles(locs) {
  const keys = new Set;
  const tiles = [];
  for (const loc of locs) {
    const key = `${loc.x},${loc.z}`;
    if (keys.has(key)) {
      continue;
    }
    keys.add(key);
    tiles.push({ x: loc.x, z: loc.z });
  }
  const byKey = new Map(tiles.map((t) => [`${t.x},${t.z}`, t]));
  const seen = new Set;
  const clusters = [];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  for (const start of tiles) {
    const startKey = `${start.x},${start.z}`;
    if (seen.has(startKey)) {
      continue;
    }
    const group = [];
    const queue = [start];
    seen.add(startKey);
    while (queue.length > 0) {
      const cur = queue.pop();
      group.push(cur);
      for (const [dx, dz] of dirs) {
        const next = byKey.get(`${cur.x + dx},${cur.z + dz}`);
        if (!next) {
          continue;
        }
        const nk = `${next.x},${next.z}`;
        if (seen.has(nk)) {
          continue;
        }
        seen.add(nk);
        queue.push(next);
      }
    }
    group.sort((a, b) => a.z - b.z || a.x - b.x);
    clusters.push(group);
  }
  return clusters;
}
function clusterDist(tiles, wx, wz) {
  let best = 1e9;
  for (const t of tiles) {
    best = Math.min(best, chebyshev(t.x, t.z, wx, wz));
  }
  return best;
}
function playerInCluster(tiles, wx, wz) {
  return tiles.some((t) => t.x === wx && t.z === wz);
}
function findNearestRoofHouse(world, baseX, baseZ, wx, wz, collision) {
  const roofs = scanRoofLocs(world, baseX, baseZ, wx, wz, ROOF_SCAN);
  const clusters = clusterRoofTiles(roofs);
  if (clusters.length === 0) {
    return { outside: true, seed: { x: wx, z: wz }, tiles: [], cluster: [], reason: "no-roofs" };
  }
  const outside = clusters.filter((c) => !playerInCluster(c, wx, wz));
  const pool = outside.length > 0 ? outside : clusters;
  pool.sort((a, b) => clusterDist(a, wx, wz) - clusterDist(b, wx, wz) || a.length - b.length);
  const cluster = pool[0];
  const seed = [...cluster].sort((a, b) => chebyshev(a.x, a.z, wx, wz) - chebyshev(b.x, b.z, wx, wz))[0];
  let fill = { inside: false, tiles: [], reason: "no-seed" };
  for (const trySeed of [seed, ...cluster]) {
    fill = floodHouse(world, baseX, baseZ, trySeed.x, trySeed.z, 0, collision[0] ?? null);
    if (fill.inside) {
      return {
        outside: !playerInCluster(cluster, wx, wz),
        seed: trySeed,
        tiles: fill.tiles,
        cluster,
        reason: fill.reason
      };
    }
  }
  return {
    outside: !playerInCluster(cluster, wx, wz),
    seed,
    tiles: cluster,
    cluster,
    reason: `flood-${fill.reason}`
  };
}
function buildRoofText(args) {
  const { wx, wz, baseX, baseZ, pick } = args;
  const lines = [];
  lines.push(`ROOF-HOUSE outside=${pick.outside ? "yes" : "no"} player=${wx},${wz} scan=${ROOF_SCAN} seed=${pick.seed.x},${pick.seed.z} tiles=${pick.tiles.length} reason=${pick.reason}`);
  lines.push("SOURCE locshape=12-21 addLoc=scenery>=12 mapl=RemoveRoof");
  lines.push("");
  const roofTiles = padTiles(pick.tiles.length > 0 ? pick.tiles : pick.cluster, 2);
  const roofs = [];
  if (args.world) {
    for (let level = 0;level < 4 /* LEVELS */; level++) {
      roofs.push(...collectHouseLocs(args.world, baseX, baseZ, roofTiles, level, true));
    }
  }
  roofs.sort((a, b) => a.z - b.z || a.x - b.x || a.level - b.level || a.type - b.type);
  lines.push("ROOFS");
  if (roofs.length === 0) {
    lines.push("2004 gap — do not invent");
  } else {
    for (const loc of roofs) {
      const h = heightAt(args.groundh, loc.level, loc.x - baseX, loc.z - baseZ);
      lines.push(locLine(loc, avgHeightM(h)));
    }
  }
  lines.push("");
  lines.push("COVER");
  let coverN = 0;
  if (args.mapl) {
    for (const t of roofTiles) {
      const lx = t.x - baseX;
      const lz = t.z - baseZ;
      if (lx < 0 || lz < 0 || lx >= 104 /* SIZE */ || lz >= 104 /* SIZE */) {
        continue;
      }
      for (let level = 0;level < 4 /* LEVELS */; level++) {
        const flags = args.mapl[level]?.[lx]?.[lz] ?? 0;
        if ((flags & 4 /* RemoveRoof */) === 0) {
          continue;
        }
        lines.push(`tile ${t.x},${t.z} level=${level} mapl=${flags}`);
        coverN++;
      }
    }
  }
  if (coverN === 0) {
    lines.push("(none)");
  }
  lines.push("");
  lines.push("VR");
  lines.push("roof-only — do not invent locs");
  lines.push("shape 12-21 only");
  return `${lines.join(`
`)}
`;
}

// src/client/RefInvDump.ts
function hslToRgb(hsl) {
  const h = (hsl >> 10 & 63) / 64;
  const s = (hsl >> 7 & 7) / 8;
  const l = (hsl & 127) / 128;
  if (s <= 0.001) {
    return [l, l, l];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}
function hue2rgb(p, q, t) {
  let u = t;
  if (u < 0) {
    u += 1;
  }
  if (u > 1) {
    u -= 1;
  }
  if (u < 1 / 6) {
    return p + (q - p) * 6 * u;
  }
  if (u < 1 / 2) {
    return q;
  }
  if (u < 2 / 3) {
    return p + (q - p) * (2 / 3 - u) * 6;
  }
  return p;
}
function rgbLine(hsl) {
  const [r, g, b] = hslToRgb(hsl);
  return `hsl=${hsl} rgb=${r.toFixed(4)},${g.toFixed(4)},${b.toFixed(4)}`;
}
function iopLine(iop) {
  return [0, 1, 2, 3, 4].map((i) => iop[i] ?? "-").join(",");
}
function snapshotObj(id) {
  try {
    const obj = ObjType.list(id);
    return {
      id: obj.id,
      name: obj.name ?? "",
      model: obj.model,
      recol_s: obj.recol_s ? Array.from(obj.recol_s) : [],
      recol_d: obj.recol_d ? Array.from(obj.recol_d) : [],
      iop: obj.iop ? [0, 1, 2, 3, 4].map((i) => obj.iop[i] ?? null) : [null, null, null, null, null],
      manwear: obj.manwear,
      womanwear: obj.womanwear,
      manwearOffset: obj.manwearOffset,
      womanwearOffset: obj.womanwearOffset,
      manwear2: obj.manwear2,
      womanwear2: obj.womanwear2,
      xan2d: obj.xan2d,
      yan2d: obj.yan2d,
      zan2d: obj.zan2d,
      zoom2d: obj.zoom2d,
      xof2d: obj.xof2d,
      yof2d: obj.yof2d
    };
  } catch {
    return null;
  }
}
var PLAYER_INV_COM = 3214;
var PLAYER_WORN_COM = 1688;
function collectFromCom(comId, kind) {
  const com = IfType.list[comId];
  if (!com || com.type !== 2 /* TYPE_INV */ || !com.linkObjType) {
    return [];
  }
  const out = [];
  const n = com.linkObjType.length;
  for (let slot = 0;slot < n; slot++) {
    const id = com.linkObjType[slot] - 1;
    if (id < 0) {
      continue;
    }
    const snap = snapshotObj(id);
    if (!snap) {
      continue;
    }
    out.push({
      comId: com.id,
      slot,
      count: com.linkObjNumber?.[slot] ?? 1,
      kind,
      snap
    });
  }
  return out;
}
function collectSlots() {
  return [...collectFromCom(PLAYER_INV_COM, "inv"), ...collectFromCom(PLAYER_WORN_COM, "worn")];
}
function addAppearanceWorn(slots, player) {
  if (!player) {
    return slots;
  }
  const value = player.appearance[3] ?? 0;
  if (value < 512) {
    return slots;
  }
  const id = value - 512;
  if (slots.some((s) => s.kind === "worn" && s.snap.id === id)) {
    return slots;
  }
  const snap = snapshotObj(id);
  if (!snap) {
    return slots;
  }
  slots.push({ comId: -1, slot: 3, count: 1, kind: "worn", snap });
  return slots;
}
function loadUnlit(item, player) {
  const gender = player?.gender ?? 0;
  const modelId = item.kind === "worn" ? gender === 1 ? item.snap.womanwear : item.snap.manwear : item.snap.model;
  if (modelId < 0) {
    return null;
  }
  try {
    const model = Model.load(modelId);
    const hsl = model.faceColour ? Int32Array.from(model.faceColour) : null;
    if (hsl) {
      for (let i = 0;i < item.snap.recol_s.length; i++) {
        const src = item.snap.recol_s[i];
        const dst = item.snap.recol_d[i];
        for (let f = 0;f < hsl.length; f++) {
          if (hsl[f] === src) {
            hsl[f] = dst;
          }
        }
      }
    }
    return {
      modelId,
      points: model.numPoints,
      faces: model.numFaces,
      x: model.pointX,
      y: model.pointY,
      z: model.pointZ,
      a: model.faceVertexA,
      b: model.faceVertexB,
      c: model.faceVertexC,
      hsl
    };
  } catch {
    return null;
  }
}
function dumpComLine(com) {
  if (!com) {
    return null;
  }
  const scripts = com.scripts ? com.scripts.filter((s) => s !== null).map((s, i) => `script${i}=${[...s].join(",")}`).join(" ") : "";
  return `com id=${com.id} type=${com.type} clientCode=${com.clientCode} size=${com.width}x${com.height} iop=${iopLine(com.iop ?? [])} ${scripts}`.trim();
}
function dumpComs(lines) {
  let n = 0;
  for (const comId of [PLAYER_INV_COM, PLAYER_WORN_COM]) {
    const line = dumpComLine(IfType.list[comId]);
    if (!line) {
      continue;
    }
    n++;
    lines.push(line);
  }
  if (n === 0) {
    lines.push("com (none)");
  }
}
function buildInvVerts(player) {
  const lines = ["INV-VERTS"];
  const slots = addAppearanceWorn(collectSlots(), player);
  if (slots.length === 0) {
    lines.push("(none)");
    return lines.join(`
`) + `
`;
  }
  for (const item of slots) {
    const loaded = loadUnlit(item, player);
    if (!loaded) {
      lines.push(`item slot=${item.slot} id=${item.snap.id} name=${item.snap.name} kind=${item.kind} model=- points=0 faces=0`);
      continue;
    }
    lines.push(`item slot=${item.slot} id=${item.snap.id} name=${item.snap.name} kind=${item.kind} model=${loaded.modelId} points=${loaded.points} faces=${loaded.faces}`);
    for (let i = 0;i < loaded.points; i++) {
      lines.push(`v ${i} ${loaded.x[i]} ${loaded.y[i]} ${loaded.z[i]}`);
    }
    for (let i = 0;i < loaded.faces; i++) {
      const hsl = loaded.hsl ? loaded.hsl[i] : -1;
      lines.push(`f ${i} ${loaded.a[i]} ${loaded.b[i]} ${loaded.c[i]} ${hsl}`);
    }
  }
  return lines.join(`
`) + `
`;
}
function buildInvColors(player) {
  const lines = ["INV-COLORS"];
  const slots = addAppearanceWorn(collectSlots(), player);
  if (slots.length === 0) {
    lines.push("(none)");
    return lines.join(`
`) + `
`;
  }
  const seen = new Set;
  for (const item of slots) {
    const key = `${item.kind}:${item.snap.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    lines.push(`obj id=${item.snap.id} name=${item.snap.name} kind=${item.kind}`);
    if (item.snap.recol_s.length === 0) {
      lines.push("recol (none)");
    } else {
      for (let i = 0;i < item.snap.recol_s.length; i++) {
        const src = item.snap.recol_s[i];
        const dst = item.snap.recol_d[i];
        lines.push(`recol ${src} -> ${dst} src ${rgbLine(src)} dst ${rgbLine(dst)}`);
      }
    }
    const loaded = loadUnlit(item, player);
    if (!loaded || !loaded.hsl) {
      lines.push("faces (none)");
      continue;
    }
    const unique = new Map;
    for (let i = 0;i < loaded.faces; i++) {
      const hsl = loaded.hsl[i];
      unique.set(hsl, (unique.get(hsl) ?? 0) + 1);
    }
    const keys = [...unique.keys()].sort((a, b) => a - b);
    for (const hsl of keys) {
      lines.push(`face n=${unique.get(hsl)} ${rgbLine(hsl)}`);
    }
  }
  return lines.join(`
`) + `
`;
}
function buildModelCallbacks(player) {
  const lines = ["MODEL-CALLBACKS"];
  lines.push("pipeline icon=getModelLit+objRender worn=getWearModel+combineForAnim slot=3");
  const slots = addAppearanceWorn(collectSlots(), player);
  dumpComs(lines);
  const seen = new Set;
  if (slots.length === 0) {
    lines.push("obj (none)");
    return lines.join(`
`) + `
`;
  }
  for (const item of slots) {
    if (seen.has(item.snap.id)) {
      continue;
    }
    seen.add(item.snap.id);
    const o = item.snap;
    const wearable = o.manwear >= 0 || o.womanwear >= 0 ? 1 : 0;
    lines.push(`obj id=${o.id} name=${o.name} iop=${iopLine(o.iop)} wearable=${wearable} manwear=${o.manwear} womanwear=${o.womanwear} manwearOffset=${o.manwearOffset} womanwearOffset=${o.womanwearOffset} model=${o.model}`);
  }
  return lines.join(`
`) + `
`;
}
function buildEquipAlign(player) {
  const lines = ["EQUIP-ALIGN"];
  if (player) {
    const right = player.appearance[3] ?? 0;
    const wornId = right >= 512 ? right - 512 : -1;
    lines.push(`player x=${player.x} z=${player.z} yaw=${player.yaw} gender=${player.gender} appearance3=${right} wornId=${wornId}`);
  } else {
    lines.push("player (none)");
  }
  const slots = addAppearanceWorn(collectSlots(), player);
  if (slots.length === 0) {
    lines.push("(none)");
    return lines.join(`
`) + `
`;
  }
  const seen = new Set;
  for (const item of slots) {
    if (seen.has(item.snap.id)) {
      continue;
    }
    seen.add(item.snap.id);
    const o = item.snap;
    lines.push(`icon id=${o.id} name=${o.name} xan2d=${o.xan2d} yan2d=${o.yan2d} zan2d=${o.zan2d} zoom2d=${o.zoom2d} xof2d=${o.xof2d} yof2d=${o.yof2d}`);
    lines.push(`worn id=${o.id} manwear=${o.manwear} womanwear=${o.womanwear} manwearOffset=${o.manwearOffset} womanwearOffset=${o.womanwearOffset} manwear2=${o.manwear2} womanwear2=${o.womanwear2}`);
  }
  return lines.join(`
`) + `
`;
}

// src/client/RefGroundDump.ts
var RADIUS = ROOF_SCAN;
function listObjs(list) {
  const out = [];
  for (let obj = list.head();obj !== null; obj = list.next()) {
    out.push(obj);
  }
  return out;
}
function objCost(obj) {
  try {
    const type = ObjType.list(obj.id);
    let cost = type.cost;
    if (type.stackable) {
      cost *= obj.count + 1;
    }
    return cost;
  } catch {
    return 0;
  }
}
function pickRoles(objs) {
  if (objs.length === 0) {
    return [];
  }
  let top = objs[0];
  let topCost = -99999999;
  for (const obj of objs) {
    const cost = objCost(obj);
    if (cost > topCost) {
      topCost = cost;
      top = obj;
    }
  }
  let bottom = null;
  let middle = null;
  for (const obj of objs) {
    if (obj.id !== top.id && !bottom) {
      bottom = obj;
      continue;
    }
    if (obj.id !== top.id && bottom && obj.id !== bottom.id && !middle) {
      middle = obj;
    }
  }
  const rows = [{ role: "top", obj: top }];
  if (bottom) {
    rows.push({ role: "bottom", obj: bottom });
  }
  if (middle) {
    rows.push({ role: "middle", obj: middle });
  }
  return rows;
}
function poseOf(go, lx, lz) {
  if (go) {
    return { x: go.x, y: go.y, z: go.z, stackH: go.height };
  }
  return { x: lx * 128 + 64, y: 0, z: lz * 128 + 64, stackH: 0 };
}
function collectGround(ctx) {
  const level = ctx.level ?? 0;
  const grid = ctx.groundObj;
  if (!grid) {
    return [];
  }
  const items = [];
  for (let wz = ctx.wz - RADIUS;wz <= ctx.wz + RADIUS; wz++) {
    for (let wx = ctx.wx - RADIUS;wx <= ctx.wx + RADIUS; wx++) {
      const lx = wx - ctx.mapBuildBaseX;
      const lz = wz - ctx.mapBuildBaseZ;
      if (lx < 0 || lz < 0 || lx >= 104 /* SIZE */ || lz >= 104 /* SIZE */) {
        continue;
      }
      const list = grid[level]?.[lx]?.[lz];
      if (!list) {
        continue;
      }
      const objs = listObjs(list);
      if (objs.length === 0) {
        continue;
      }
      const go = ctx.world?.squareAt(level, lx, lz)?.groundObject ?? null;
      const pose = poseOf(go, lx, lz);
      for (const row of pickRoles(objs)) {
        let name = `#${row.obj.id}`;
        let model = -1;
        try {
          const type = ObjType.list(row.obj.id);
          name = type.name ?? name;
          model = type.model;
        } catch {}
        items.push({
          wx,
          wz,
          level,
          id: row.obj.id,
          name,
          count: row.obj.count,
          model,
          role: row.role,
          y: pose.y,
          x: pose.x,
          z: pose.z,
          stackH: pose.stackH
        });
      }
    }
  }
  return items;
}
function loadGroundModel(id, count) {
  try {
    const type = ObjType.list(id);
    const mesh = type.getModelLit(count);
    if (!mesh) {
      return null;
    }
    return { modelId: type.model, mesh };
  } catch {
    return null;
  }
}
function buildGroundObjs(ctx) {
  const lines = ["GROUND-OBJS", "pipeline ground=getModelLit+worldRender yaw=0"];
  const items = collectGround(ctx);
  if (items.length === 0) {
    lines.push("(none)");
    return lines.join(`
`) + `
`;
  }
  for (const item of items) {
    lines.push(`obj wx=${item.wx} wz=${item.wz} level=${item.level} id=${item.id} name=${item.name} count=${item.count} model=${item.model} role=${item.role} y=${item.y} x=${item.x} z=${item.z} stackH=${item.stackH}`);
  }
  return lines.join(`
`) + `
`;
}
function buildGroundVerts(ctx) {
  const lines = ["GROUND-VERTS"];
  const items = collectGround(ctx);
  if (items.length === 0) {
    lines.push("(none)");
    return lines.join(`
`) + `
`;
  }
  const seen = new Set;
  for (const item of items) {
    const key = `${item.id}:${item.count}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const loaded = loadGroundModel(item.id, item.count);
    if (!loaded) {
      lines.push(`item wx=${item.wx} wz=${item.wz} id=${item.id} name=${item.name} kind=ground model=- points=0 faces=0`);
      continue;
    }
    const m = loaded.mesh;
    lines.push(`item wx=${item.wx} wz=${item.wz} id=${item.id} name=${item.name} kind=ground model=${loaded.modelId} points=${m.numPoints} faces=${m.numFaces}`);
    for (let i = 0;i < m.numPoints; i++) {
      lines.push(`v ${i} ${m.pointX[i]} ${m.pointY[i]} ${m.pointZ[i]}`);
    }
    for (let i = 0;i < m.numFaces; i++) {
      const hsl = m.faceColour ? m.faceColour[i] : -1;
      lines.push(`f ${i} ${m.faceVertexA[i]} ${m.faceVertexB[i]} ${m.faceVertexC[i]} ${hsl}`);
    }
  }
  return lines.join(`
`) + `
`;
}

// src/client/RefCapture.ts
var INGEST = "http://127.0.0.1:43596/capture";
var RADIUS2 = ROOF_SCAN;
var MAX_TICKS = 25;
var INTERVAL_MS = 600;

class RefCapture {
  static on = false;
  static session = "";
  static startWx = 0;
  static startWz = 0;
  static tick = 0;
  static warned = false;
  static busy = false;
  static lastStartedMs = 0;
  static notify = null;
  static async dumpHouse(ctx, chat) {
    const level = ctx.level ?? 0;
    const fill = ctx.world ? floodHouse(ctx.world, ctx.mapBuildBaseX, ctx.mapBuildBaseZ, ctx.wx, ctx.wz, level, ctx.collision[level] ?? null) : { inside: false, tiles: [], reason: "no-world" };
    const dump = buildHouseText({
      wx: ctx.wx,
      wz: ctx.wz,
      level,
      baseX: ctx.mapBuildBaseX,
      baseZ: ctx.mapBuildBaseZ,
      fill,
      groundh: ctx.groundh,
      collision: ctx.collision,
      world: ctx.world,
      build: ctx.build
    });
    if (!fill.inside) {
      chat("not inside a house");
    } else {
      const walkCounts = [];
      for (let lvl = 0;lvl < 4; lvl++) {
        const re = new RegExp(`tile \\d+,\\d+ level=${lvl} flags=\\d+ walk=yes`, "g");
        walkCounts.push((dump.match(re) ?? []).length);
      }
      chat(`inside house tiles=${fill.tiles.length} floor=${level} walkable L0=${walkCounts[0]} L1=${walkCounts[1]} L2=${walkCounts[2]} L3=${walkCounts[3]}`);
    }
    const now = new Date;
    const pad = (n) => String(n).padStart(2, "0");
    const session = `house-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    try {
      const res = await fetch(INGEST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "house",
          session,
          tick: 0,
          wx: ctx.wx,
          wz: ctx.wz,
          dump
        })
      });
      if (!res.ok) {
        console.warn("house dump ingest rejected", res.status);
      }
    } catch {
      console.warn("house dump ingest down — start LostCityRef.bat");
      chat("house dump ingest down");
    }
  }
  static async dumpRoof(ctx, chat) {
    const pick = ctx.world ? findNearestRoofHouse(ctx.world, ctx.mapBuildBaseX, ctx.mapBuildBaseZ, ctx.wx, ctx.wz, ctx.collision) : { outside: true, seed: { x: ctx.wx, z: ctx.wz }, tiles: [], cluster: [], reason: "no-world" };
    const dump = buildRoofText({
      wx: ctx.wx,
      wz: ctx.wz,
      baseX: ctx.mapBuildBaseX,
      baseZ: ctx.mapBuildBaseZ,
      pick,
      groundh: ctx.groundh,
      world: ctx.world,
      mapl: ctx.mapl ?? null
    });
    if (pick.reason === "no-roofs" || pick.reason === "no-world") {
      chat(`no roof house ${pick.reason}`);
    } else {
      chat(`roof house outside=${pick.outside ? "yes" : "no"} tiles=${pick.tiles.length} seed=${pick.seed.x},${pick.seed.z}`);
    }
    const now = new Date;
    const pad = (n) => String(n).padStart(2, "0");
    const session = `roof-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    try {
      const res = await fetch(INGEST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "roof",
          session,
          tick: 0,
          wx: ctx.wx,
          wz: ctx.wz,
          dump
        })
      });
      if (!res.ok) {
        console.warn("roof dump ingest rejected", res.status);
      }
    } catch {
      console.warn("roof dump ingest down — start LostCityRef.bat");
      chat("roof dump ingest down");
    }
  }
  static toggle(wx, wz, chat) {
    this.on = !this.on;
    this.notify = chat;
    if (this.on) {
      const now = new Date;
      const pad = (n) => String(n).padStart(2, "0");
      this.session = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      this.startWx = wx;
      this.startWz = wz;
      this.tick = 0;
      this.warned = false;
      this.busy = false;
      this.lastStartedMs = 0;
      chat(`ref capture on ${this.session} at ${wx},${wz} radius=${RADIUS2} 25 shots @ 0.6s`);
      console.log(`ref capture on ${this.session}`);
    } else {
      chat(`ref capture off after ${this.tick} shots`);
      console.log("ref capture off");
    }
    return this.on;
  }
  static async captureTick(ctx) {
    if (!this.on || this.busy) {
      return;
    }
    if (this.tick >= MAX_TICKS) {
      this.stopCap();
      return;
    }
    const now = performance.now();
    if (this.tick > 0 && now - this.lastStartedMs < INTERVAL_MS) {
      return;
    }
    this.lastStartedMs = now;
    this.busy = true;
    this.tick++;
    const dump = this.buildDump(ctx);
    const build = this.buildGodot(ctx);
    const invVerts = buildInvVerts(ctx.player ?? null);
    const invColors = buildInvColors(ctx.player ?? null);
    const modelCallbacks = buildModelCallbacks(ctx.player ?? null);
    const equipAlign = buildEquipAlign(ctx.player ?? null);
    const groundObjs = buildGroundObjs(ctx);
    const groundVerts = buildGroundVerts(ctx);
    let png = "";
    try {
      png = await this.canvasPng();
    } catch (e) {
      console.warn("ref capture png failed", e);
    }
    try {
      const res = await fetch(INGEST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: this.session,
          tick: this.tick,
          wx: this.startWx,
          wz: this.startWz,
          dump,
          build,
          png,
          invVerts,
          invColors,
          modelCallbacks,
          equipAlign,
          groundObjs,
          groundVerts
        })
      });
      if (!res.ok && !this.warned) {
        this.warned = true;
        console.warn("ref capture ingest rejected", res.status);
        this.notify?.(`ingest rejected ${res.status} — start LostCityRef.bat`);
      }
    } catch {
      if (!this.warned) {
        this.warned = true;
        console.warn("ref capture ingest down — start LostCityRef.bat");
        this.notify?.("ingest down — start LostCityRef.bat");
      }
    } finally {
      this.busy = false;
    }
    if (this.on && this.tick >= MAX_TICKS) {
      this.stopCap();
    }
  }
  static stopCap() {
    if (!this.on) {
      return;
    }
    this.on = false;
    this.notify?.(`ref capture off after ${this.tick} shots`);
    console.log("ref capture stopped at tick cap");
  }
  static canvasPng() {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("empty canvas"));
          return;
        }
        const reader = new FileReader;
        reader.onloadend = () => {
          const result = String(reader.result ?? "");
          const comma = result.indexOf(",");
          resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      }, "image/png");
    });
  }
  static buildDump(ctx) {
    const lines = [];
    const mx = (ctx.wx >> 6) * 64;
    const mz = (ctx.wz >> 6) * 64;
    lines.push(`tile ${ctx.wx},${ctx.wz} radius=${RADIUS2}`);
    lines.push(`source webclient loopCycle=${ctx.loopCycle} camYaw=${ctx.camYaw} camPitch=${ctx.camPitch}`);
    lines.push(`map ${ctx.wx >> 6}_${ctx.wz >> 6} world origin ${mx},${mz} base=${ctx.mapBuildBaseX},${ctx.mapBuildBaseZ}`);
    lines.push("");
    lines.push("TILES");
    for (let z = ctx.wz - RADIUS2;z <= ctx.wz + RADIUS2; z++) {
      for (let x = ctx.wx - RADIUS2;x <= ctx.wx + RADIUS2; x++) {
        for (let level = 0;level < 4 /* LEVELS */; level++) {
          const line = this.tileLine(ctx, x, z, level);
          if (line) {
            lines.push(line);
          }
        }
      }
    }
    lines.push("");
    this.appendEdges(ctx, lines);
    lines.push("");
    lines.push("LOCS");
    for (let z = ctx.wz - RADIUS2;z <= ctx.wz + RADIUS2; z++) {
      for (let x = ctx.wx - RADIUS2;x <= ctx.wx + RADIUS2; x++) {
        this.appendLocs(ctx, x, z, lines);
      }
    }
    lines.push("");
    this.appendAnims(ctx, lines);
    lines.push("");
    this.appendEntities(ctx, lines);
    lines.push("");
    this.appendUi(ctx, lines);
    return lines.join(`
`) + `
`;
  }
  static mapsquareKeys(wx, wz) {
    const keys = new Set;
    for (let z = wz - RADIUS2;z <= wz + RADIUS2; z++) {
      for (let x = wx - RADIUS2;x <= wx + RADIUS2; x++) {
        const key = `${x >> 6}_${z >> 6}`;
        if (key !== "48_148") {
          keys.add(key);
        }
      }
    }
    return [...keys].sort();
  }
  static buildGodot(ctx) {
    const keys = this.mapsquareKeys(ctx.wx, ctx.wz);
    const lines = [];
    lines.push(`godot-build tile ${ctx.wx},${ctx.wz} radius=${RADIUS2}`);
    lines.push(`mapsquares ${keys.join(" ")}`);
    lines.push("never 48_148");
    lines.push("");
    lines.push("EXPORT from engine/");
    for (const key of keys) {
      lines.push(`npx tsx tools/vr/ExportGltf.ts ../vr-client/assets/rs ${key}`);
    }
    lines.push("");
    lines.push("GODOT");
    lines.push(`append ${keys.join(", ")} to ZONE_SQUARES in vr-client/scripts/WorldStreamer.gd`);
    lines.push(`LostCityVR.bat then F12 at ${ctx.wx},${ctx.wz}`);
    lines.push("compare this folder to vr-client/debug-dumps/");
    lines.push("");
    lines.push("RULES");
    lines.push("do not invent locs");
    lines.push("if LOCS has no wall loc it is a 2004 gap");
    lines.push("walk uses _edges only (shape 0/9 one side, 1/3 none, 2 both)");
    lines.push("keep cook-east overlay 22");
    lines.push("do not flatten height");
    lines.push("loc-edits.json only after comparing this dump");
    lines.push("if ANIMS has no loc seq do not invent a door swing");
    lines.push("");
    const locLines = [];
    for (let z = ctx.wz - RADIUS2;z <= ctx.wz + RADIUS2; z++) {
      for (let x = ctx.wx - RADIUS2;x <= ctx.wx + RADIUS2; x++) {
        this.appendLocs(ctx, x, z, locLines);
      }
    }
    lines.push("COUNTS");
    if (locLines.length === 0) {
      lines.push("(none)");
    } else {
      lines.push(...this.locCountLines(locLines));
    }
    lines.push("");
    lines.push("LOCS");
    if (locLines.length === 0) {
      lines.push("(none)");
    } else {
      lines.push(...locLines);
    }
    lines.push("");
    this.appendAnims(ctx, lines);
    lines.push("");
    this.appendEntities(ctx, lines);
    lines.push("");
    this.appendUi(ctx, lines);
    return lines.join(`
`) + `
`;
  }
  static locCountLines(locLines) {
    const counts = new Map;
    const re = /kind=(\S+) type=(\d+).*shape=(\d+).*level=(\d+)/;
    for (const line of locLines) {
      const m = line.match(re);
      if (!m) {
        continue;
      }
      const key = `kind=${m[1]} type=${m[2]} shape=${m[3]} level=${m[4]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.keys()].sort().map((key) => `n=${counts.get(key)} ${key}`);
  }
  static tileLine(ctx, wx, wz, level) {
    const lx = wx - ctx.mapBuildBaseX;
    const lz = wz - ctx.mapBuildBaseZ;
    if (lx < 0 || lz < 0 || lx >= 104 /* SIZE */ || lz >= 104 /* SIZE */) {
      return level === 0 ? `tile ${wx},${wz} off-map` : null;
    }
    const h = heightAt(ctx.groundh, level, lx, lz);
    const cmap = ctx.collision[level];
    const flags = cmap ? cmap.flags[CollisionMap.index(lx, lz)] : 0;
    let ov = -1;
    let und = -1;
    let packed = -1;
    let rot = -1;
    if (ctx.build) {
      und = ctx.build.underlayAt(level, lx, lz);
      ov = ctx.build.overlayAt(level, lx, lz);
      packed = ctx.build.overlayShapeAt(level, lx, lz);
      rot = ctx.build.overlayRotAt(level, lx, lz);
    }
    const mapl = ctx.mapl?.[level]?.[lx]?.[lz] ?? 0;
    const mapl1 = ctx.mapl?.[1]?.[lx]?.[lz] ?? 0;
    const linkBelow = (mapl1 & 2 /* LinkBelow */) !== 0;
    const block = (mapl & 1 /* Block */) !== 0;
    if (level > 0 && ov <= 0 && und <= 0 && flags === 0 && mapl === 0 && h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0) {
      return null;
    }
    const flo = this.floLook(ov > 0 ? ov : und);
    const emit = ov > 0 && packed > 0 ? "tris" : "flat";
    const walk = (flags & 2621696 /* SQ_BLOCKED */) === 0 ? "yes" : "no";
    return `tile ${wx},${wz} level=${level} lx=${lx},${lz} ov=${ov} packed=${packed} rot=${rot} und=${und}` + ` flags=${flags} mapl=${mapl} linkBelow=${linkBelow ? "yes" : "no"} block=${block ? "yes" : "no"}` + ` walk=${walk} edges=${decodeBlockDirs(flags)} floTex=${flo.tex} floRgb=${flo.rgb} emit=${emit}` + ` h=(${h[0]},${h[1]},${h[2]},${h[3]}) y=${avgHeightM(h).toFixed(3)}`;
  }
  static floLook(id) {
    if (id <= 0 || id >= FloType.list.length || !FloType.list[id]) {
      return { tex: -1, rgb: 0 };
    }
    const flo = FloType.list[id];
    return { tex: flo.texture, rgb: flo.colour };
  }
  static appendEdges(ctx, lines) {
    lines.push("EDGES");
    lines.push("CollisionMap W_N/E/S/W; compare to VR EDGES LIVE");
    const keys = new Set;
    for (let level = 0;level < 4 /* LEVELS */; level++) {
      const cmap = ctx.collision[level];
      if (!cmap) {
        continue;
      }
      for (let z = ctx.wz - RADIUS2;z <= ctx.wz + RADIUS2; z++) {
        for (let x = ctx.wx - RADIUS2;x <= ctx.wx + RADIUS2; x++) {
          const lx = x - ctx.mapBuildBaseX;
          const lz = z - ctx.mapBuildBaseZ;
          if (lx < 0 || lz < 0 || lx >= 104 /* SIZE */ || lz >= 104 /* SIZE */) {
            continue;
          }
          const flags = cmap.flags[CollisionMap.index(lx, lz)];
          const add = (bx, bz) => {
            const a = x < bx || x === bx && z < bz ? `${x},${z}>${bx},${bz}` : `${bx},${bz}>${x},${z}`;
            keys.add(`edge ${a} level=${level}`);
          };
          if ((flags & 128 /* W_W */) !== 0) {
            add(x - 1, z);
          }
          if ((flags & 8 /* W_E */) !== 0) {
            add(x + 1, z);
          }
          if ((flags & 2 /* W_N */) !== 0) {
            add(x, z + 1);
          }
          if ((flags & 32 /* W_S */) !== 0) {
            add(x, z - 1);
          }
        }
      }
    }
    if (keys.size === 0) {
      lines.push("(none in radius)");
      return;
    }
    lines.push(...[...keys].sort());
  }
  static appendLocs(ctx, wx, wz, lines) {
    if (!ctx.world) {
      return;
    }
    const lx = wx - ctx.mapBuildBaseX;
    const lz = wz - ctx.mapBuildBaseZ;
    if (lx < 0 || lz < 0 || lx >= 104 /* SIZE */ || lz >= 104 /* SIZE */) {
      return;
    }
    for (let level = 0;level < 4 /* LEVELS */; level++) {
      const tile = ctx.world.squareAt(level, lx, lz);
      if (!tile) {
        continue;
      }
      if (tile.wall) {
        const info = tile.wall.typecode2 & 255;
        lines.push(this.locDumpLine("wall", tile.wall.typecode, info, level, wx, wz, lx, lz, ctx, tile.wall.model1 ? "yes" : "no", tile.wall.model2 ? "yes" : "no"));
      }
      if (tile.decor) {
        const info = tile.decor.typecode2 & 255;
        lines.push(this.locDumpLine("decor", tile.decor.typecode, info, level, wx, wz, lx, lz, ctx, tile.decor.model ? "yes" : "no", "no"));
      }
      if (tile.groundDecor) {
        const info = tile.groundDecor.typecode2 & 255;
        lines.push(this.locDumpLine("gdecor", tile.groundDecor.typecode, info, level, wx, wz, lx, lz, ctx, tile.groundDecor.model ? "yes" : "no", "no"));
      }
      for (let i = 0;i < tile.spriteCount; i++) {
        const sprite = tile.sprites[i];
        if (!sprite || sprite.minTileX !== lx || sprite.minTileZ !== lz) {
          continue;
        }
        if ((sprite.typecode >> 29 & 3) !== 2) {
          continue;
        }
        const info = sprite.typecode2 & 255;
        lines.push(this.locDumpLine("scenery", sprite.typecode, info, level, wx, wz, lx, lz, ctx, sprite.model ? "yes" : "no", "no"));
      }
    }
  }
  static locDumpLine(kind, typecode, info, level, wx, wz, lx, lz, ctx, model1, model2) {
    const locId = typecode >> 14 & 32767;
    let anim = -1;
    let frames = 0;
    let duration = 0;
    try {
      anim = LocType.list(locId)?.anim ?? -1;
      if (anim >= 0 && SeqType.list[anim]) {
        frames = SeqType.list[anim].numFrames;
        duration = SeqType.list[anim].duration;
      }
    } catch {
      anim = -1;
    }
    const live = ` model1=${model1} model2=${model2} anim=${anim} frames=${frames} duration=${duration}`;
    const loc = describeLoc(kind, typecode, info, level, wx, wz);
    const yM = avgHeightM(heightAt(ctx.groundh, level, lx, lz));
    if (loc) {
      return locLine(loc, yM) + live;
    }
    const shape = info & 31;
    const angle = info >> 6 & 3;
    let name = "";
    try {
      name = LocType.list(locId)?.name ?? "";
    } catch {
      name = "";
    }
    return `loc kind=${kind} type=${locId} name=${name} shape=${shape} angle=${angle} level=${level} at ${wx},${wz} y=${yM.toFixed(3)}${live}`;
  }
  static ifLine(id) {
    if (id < 0 || !IfType.list[id]) {
      return String(id);
    }
    const com = IfType.list[id];
    const scripts = com.scripts ? com.scripts.filter((s) => s !== null).length : 0;
    return `${id} type=${com.type} clientCode=${com.clientCode} scripts=${scripts}`;
  }
  static appendAnims(ctx, lines) {
    lines.push("ANIMS");
    const live = ctx.locAnims ?? [];
    if (live.length === 0) {
      lines.push("(none)");
      return;
    }
    for (const anim of live) {
      lines.push(`anim loc type=${anim.type} seq=${anim.seq} frame=${anim.frame} frames=${anim.frames} duration=${anim.duration}`);
    }
  }
  static appendEntities(ctx, lines) {
    lines.push("PLAYERS");
    const players = ctx.playerLines ?? [];
    if (players.length === 0) {
      lines.push("(none)");
    } else {
      lines.push(...players);
    }
    lines.push("NPCS");
    const npcs = ctx.npcLines ?? [];
    if (npcs.length === 0) {
      lines.push("(none)");
    } else {
      lines.push(...npcs);
    }
    lines.push("SEQS");
    const seqs = ctx.seqLines ?? [];
    if (seqs.length === 0) {
      lines.push("(none)");
    } else {
      lines.push(...seqs);
    }
  }
  static appendUi(ctx, lines) {
    lines.push("UI");
    const ui = ctx.ui;
    if (!ui) {
      lines.push("(none)");
      return;
    }
    lines.push(`ui mainModal=${this.ifLine(ui.mainModal)}`);
    lines.push(`ui sideModal=${this.ifLine(ui.sideModal)}`);
    lines.push(`ui sideTab=${ui.sideTab} overlay=${this.ifLine(ui.sideOverlay)}`);
    lines.push(`ui chatCom=${this.ifLine(ui.chatCom)}`);
    lines.push(`ui tutCom=${this.ifLine(ui.tutCom)}`);
    if (ui.menu.length === 0) {
      lines.push("ui menu (none)");
      return;
    }
    for (let i = 0;i < ui.menu.length; i++) {
      lines.push(`ui menu ${i} ${ui.menu[i]}`);
    }
  }
}

// src/client/RefAnimLog.ts
var INGEST2 = "http://127.0.0.1:43596/capture";

class RefAnimLog {
  static on = false;
  static session = "";
  static startWx = 0;
  static startWz = 0;
  static tick = 0;
  static warned = false;
  static busy = false;
  static notify = null;
  static toggle(wx, wz, chat) {
    this.on = !this.on;
    this.notify = chat;
    if (this.on) {
      const now = new Date;
      const pad = (n) => String(n).padStart(2, "0");
      this.session = `anim-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      this.startWx = wx;
      this.startWz = wz;
      this.tick = 0;
      this.warned = false;
      this.busy = false;
      chat(`anim log on ${this.session} at ${wx},${wz}`);
      console.log(`anim log on ${this.session}`);
    } else {
      chat(`anim log off after ${this.tick} ticks`);
      console.log("anim log off");
    }
    return this.on;
  }
  static async logTick(loopCycle, dump) {
    if (!this.on || this.busy) {
      return;
    }
    this.busy = true;
    this.tick++;
    try {
      const res = await fetch(INGEST2, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "anim",
          session: this.session,
          tick: this.tick,
          wx: this.startWx,
          wz: this.startWz,
          loopCycle,
          dump
        })
      });
      if (!res.ok && !this.warned) {
        this.warned = true;
        console.warn("anim log ingest rejected", res.status);
        this.notify?.(`ingest rejected ${res.status} — start LostCityRef.bat`);
      }
    } catch {
      if (!this.warned) {
        this.warned = true;
        console.warn("anim log ingest down — start LostCityRef.bat");
        this.notify?.("ingest down — start LostCityRef.bat");
      }
    } finally {
      this.busy = false;
    }
  }
}

// src/client/RefEntityAnim.ts
function sanitize(s) {
  return s && s.length > 0 ? s.replace(/\s+/g, "_") : "-";
}
function seqOf(id) {
  if (id < 0 || id >= SeqType.list.length) {
    return null;
  }
  return SeqType.list[id] ?? null;
}
function seqFrameId(seqId, frameIndex) {
  const seq = seqOf(seqId);
  if (!seq?.frames || frameIndex < 0 || frameIndex >= seq.frames.length) {
    return -1;
  }
  return seq.frames[frameIndex];
}
function seqDelayAt(seqId, frameIndex) {
  const seq = seqOf(seqId);
  if (!seq?.delay || frameIndex < 0 || frameIndex >= seq.delay.length) {
    return -1;
  }
  return seq.delay[frameIndex];
}
function seqHasWalkmerge(seqId) {
  const seq = seqOf(seqId);
  return Boolean(seq?.walkmerge && seq.walkmerge.length > 0);
}
function seqDumpLine(seqId) {
  const seq = seqOf(seqId);
  if (!seq) {
    return `seq id=${seqId} missing`;
  }
  const frames = seq.frames ? Array.from(seq.frames).join(",") : "";
  const delays = seq.delay ? Array.from(seq.delay).join(",") : "";
  const n = seq.numFrames;
  return `seq id=${seqId} frames=${n} delays=${delays} frameIds=${frames} walkmerge=${seqHasWalkmerge(seqId) ? "yes" : "no"}`;
}
function modelsNpc(npc) {
  const models = npc.type?.model;
  if (!models || models.length === 0) {
    return "-";
  }
  return Array.from(models).join(",");
}
function kitPlayer(player) {
  return Array.from(player.appearance).join(",");
}
function entityBits(ready, typeReady, typeWalk, models, primary, primaryFrame, primaryDelay, primaryCycle, secondary, secondaryFrame, secondaryCycle, spot, spotFrame, yaw, moving) {
  const primaryFrameId = seqFrameId(primary, primaryFrame);
  const secondaryFrameId = seqFrameId(secondary, secondaryFrame);
  const seqDelay = seqDelayAt(primary >= 0 ? primary : secondary, primary >= 0 ? primaryFrame : secondaryFrame);
  const mergeId = primary >= 0 ? primary : secondary;
  return ` moving=${moving ? "yes" : "no"}` + ` ready=${ready} typeReady=${typeReady} typeWalk=${typeWalk}` + ` models=${models}` + ` primary=${primary} primaryFrame=${primaryFrame} primaryFrameId=${primaryFrameId}` + ` primaryDelay=${primaryDelay} seqDelay=${seqDelay} primaryCycle=${primaryCycle}` + ` secondary=${secondary} secondaryFrame=${secondaryFrame} secondaryFrameId=${secondaryFrameId}` + ` secondaryCycle=${secondaryCycle}` + ` walkmerge=${seqHasWalkmerge(mergeId) ? "yes" : "no"}` + ` spot=${spot} spotFrame=${spotFrame}` + ` yaw=${yaw}`;
}
function playerAnimLine(index, player, mapBuildBaseX, mapBuildBaseZ) {
  const px = (player.x >> 7) + mapBuildBaseX;
  const pz = (player.z >> 7) + mapBuildBaseZ;
  return `player slot=${index} name=${sanitize(player.name)} at ${px},${pz}` + entityBits(player.readyanim, player.readyanim, player.walkanim, kitPlayer(player), player.primaryAnim, player.primaryAnimFrame, player.primaryAnimDelay, player.primaryAnimCycle, player.secondaryAnim, player.secondaryAnimFrame, player.secondaryAnimCycle, player.spotanimId, player.spotanimFrame, player.yaw, player.routeLength > 0);
}
function npcAnimLine(index, npc, mapBuildBaseX, mapBuildBaseZ) {
  const nx = (npc.x >> 7) + mapBuildBaseX;
  const nz = (npc.z >> 7) + mapBuildBaseZ;
  const type = npc.type;
  return `npc slot=${index} type=${type?.id ?? -1} name=${sanitize(type?.name)} at ${nx},${nz}` + entityBits(npc.readyanim, type?.readyanim ?? -1, type?.walkanim ?? -1, modelsNpc(npc), npc.primaryAnim, npc.primaryAnimFrame, npc.primaryAnimDelay, npc.primaryAnimCycle, npc.secondaryAnim, npc.secondaryAnimFrame, npc.secondaryAnimCycle, npc.spotanimId, npc.spotanimFrame, npc.yaw, npc.routeLength > 0);
}
function collectSeqIds(players, npcs) {
  const seen = new Set;
  const add = (id) => {
    if (id >= 0) {
      seen.add(id);
    }
  };
  for (const player of players) {
    add(player.readyanim);
    add(player.walkanim);
    add(player.walkanim_b);
    add(player.walkanim_l);
    add(player.walkanim_r);
    add(player.runanim);
    add(player.primaryAnim);
    add(player.secondaryAnim);
  }
  for (const npc of npcs) {
    add(npc.readyanim);
    add(npc.walkanim);
    add(npc.primaryAnim);
    add(npc.secondaryAnim);
    if (npc.type) {
      add(npc.type.readyanim);
      add(npc.type.walkanim);
      add(npc.type.walkanim_b);
      add(npc.type.walkanim_l);
      add(npc.type.walkanim_r);
    }
  }
  return [...seen].sort((a, b) => a - b);
}
function formatSeqBlock(ids) {
  return ids.map(seqDumpLine);
}

// src/dash3d/ModelSource.ts
class ModelSource extends Linkable {
  getTempModel(_loopCycle) {
    return null;
  }
}

// src/dash3d/ClientEntity.ts
class ClientEntity extends ModelSource {
  x = 0;
  z = 0;
  yaw = 0;
  needsForwardDrawPadding = false;
  size = 1;
  readyanim = -1;
  turnanim = -1;
  walkanim = -1;
  walkanim_b = -1;
  walkanim_l = -1;
  walkanim_r = -1;
  runanim = -1;
  chatMessage = null;
  chatTimer = 100;
  chatColour = 0;
  chatEffect = 0;
  combatCycle = -1000;
  damageValue = 0;
  damageType = 0;
  health = 0;
  totalHealth = 0;
  faceEntity = -1;
  faceSquareX = 0;
  faceSquareZ = 0;
  secondaryAnim = -1;
  secondaryAnimFrame = 0;
  secondaryAnimCycle = 0;
  primaryAnim = -1;
  primaryAnimFrame = 0;
  primaryAnimCycle = 0;
  primaryAnimDelay = 0;
  primaryAnimLoop = 0;
  spotanimId = -1;
  spotanimFrame = 0;
  spotanimCycle = 0;
  spotanimLastCycle = 0;
  spotanimHeight = 0;
  exactStartX = 0;
  exactEndX = 0;
  exactStartZ = 0;
  exactEndZ = 0;
  exactMoveEnd = 0;
  exactMoveStart = 0;
  exactMoveFacing = 0;
  cycle = 0;
  height = 0;
  dstYaw = 0;
  routeLength = 0;
  routeX = new Int32Array(10);
  routeZ = new Int32Array(10);
  routeRun = new TypedArray1d(10, false);
  animDelayMove = 0;
  teleport(jump, x, z) {
    if (this.primaryAnim !== -1 && SeqType.list[this.primaryAnim].priority <= 1) {
      this.primaryAnim = -1;
    }
    if (!jump) {
      const dx = x - this.routeX[0];
      const dz = z - this.routeZ[0];
      if (dx >= -8 && dx <= 8 && dz >= -8 && dz <= 8) {
        if (this.routeLength < 9) {
          this.routeLength++;
        }
        for (let i = this.routeLength;i > 0; i--) {
          this.routeX[i] = this.routeX[i - 1];
          this.routeZ[i] = this.routeZ[i - 1];
          this.routeRun[i] = this.routeRun[i - 1];
        }
        this.routeX[0] = x;
        this.routeZ[0] = z;
        this.routeRun[0] = false;
        return;
      }
    }
    this.routeLength = 0;
    this.animDelayMove = 0;
    this.routeX[0] = x;
    this.routeZ[0] = z;
    this.x = this.routeX[0] * 128 + this.size * 64;
    this.z = this.routeZ[0] * 128 + this.size * 64;
  }
  moveCode(running, direction) {
    let nextX = this.routeX[0];
    let nextZ = this.routeZ[0];
    if (direction === 0) {
      nextX--;
      nextZ++;
    } else if (direction === 1) {
      nextZ++;
    } else if (direction === 2) {
      nextX++;
      nextZ++;
    } else if (direction === 3) {
      nextX--;
    } else if (direction === 4) {
      nextX++;
    } else if (direction === 5) {
      nextX--;
      nextZ--;
    } else if (direction === 6) {
      nextZ--;
    } else if (direction === 7) {
      nextX++;
      nextZ--;
    }
    if (this.primaryAnim !== -1 && SeqType.list[this.primaryAnim].priority <= 1) {
      this.primaryAnim = -1;
    }
    if (this.routeLength < 9) {
      this.routeLength++;
    }
    for (let i = this.routeLength;i > 0; i--) {
      this.routeX[i] = this.routeX[i - 1];
      this.routeZ[i] = this.routeZ[i - 1];
      this.routeRun[i] = this.routeRun[i - 1];
    }
    this.routeX[0] = nextX;
    this.routeZ[0] = nextZ;
    this.routeRun[0] = running;
  }
}

// src/dash3d/ClientNpc.ts
class ClientNpc extends ClientEntity {
  type = null;
  getTempModel(_loopCycle) {
    if (this.type == null) {
      return null;
    }
    if (this.spotanimId === -1 || this.spotanimFrame === -1) {
      return this.getTempModel2();
    }
    let model = this.getTempModel2();
    if (model == null) {
      return null;
    }
    const spot = SpotType.list[this.spotanimId];
    const spotModel = spot.getTempModel2();
    const temp = Model.copyForAnim(spotModel, true, !spot.animateTransparencies, false);
    temp.translate(-this.spotanimHeight, 0, 0);
    temp.prepareAnim();
    if (spot.seq && spot.seq.frames) {
      temp.animate(spot.seq.frames[this.spotanimFrame]);
    }
    temp.labelFaces = null;
    temp.labelVertices = null;
    if (spot.resizeh != 128 || spot.resizev != 128) {
      temp.resize(spot.resizeh, spot.resizev, spot.resizeh);
    }
    temp.calculateNormals(spot.ambient + 64, spot.contrast + 850, -30, -50, -30, true);
    const models = [model, temp];
    model = Model.combine(models, 2);
    if (this.type.size == 1) {
      model.useAABBMouseCheck = true;
    }
    return model;
  }
  getTempModel2() {
    if (!this.type) {
      return null;
    }
    if (this.primaryAnim < 0 || this.primaryAnimDelay != 0) {
      const secondarySeq = SeqType.list[this.secondaryAnim];
      let secondaryTransform = -1;
      if (this.secondaryAnim >= 0 && secondarySeq.frames) {
        secondaryTransform = secondarySeq.frames[this.secondaryAnimFrame];
      }
      const model = this.type.getTempModel(secondaryTransform, -1, null);
      if (!model) {
        return null;
      }
      this.height = model.minY;
      return model;
    } else {
      const primarySeq = SeqType.list[this.primaryAnim];
      let primaryTransform = -1;
      if (primarySeq.frames) {
        primaryTransform = primarySeq.frames[this.primaryAnimFrame];
      }
      const secondarySeq = SeqType.list[this.secondaryAnim];
      let secondaryTransform = -1;
      if (this.secondaryAnim >= 0 && this.secondaryAnim != this.readyanim && secondarySeq.frames) {
        secondaryTransform = secondarySeq.frames[this.secondaryAnimFrame];
      }
      return this.type.getTempModel(primaryTransform, secondaryTransform, primarySeq.walkmerge);
    }
  }
  isReady() {
    return this.type !== null;
  }
}

// src/dash3d/ClientPlayer.ts
class ClientPlayer extends ClientEntity {
  static recol2d = [
    9104 /* BODY_RECOLOR_KHAKI */,
    10275 /* BODY_RECOLOR_CHARCOAL */,
    7595 /* BODY_RECOLOR_CRIMSON */,
    3610 /* BODY_RECOLOR_NAVY */,
    7975 /* BODY_RECOLOR_STRAW */,
    8526 /* BODY_RECOLOR_WHITE */,
    918 /* BODY_RECOLOR_RED */,
    38802 /* BODY_RECOLOR_BLUE */,
    24466 /* BODY_RECOLOR_GREEN */,
    10145 /* BODY_RECOLOR_YELLOW */,
    58654 /* BODY_RECOLOR_PURPLE */,
    5027 /* BODY_RECOLOR_ORANGE */,
    1457 /* BODY_RECOLOR_ROSE */,
    16565 /* BODY_RECOLOR_LIME */,
    34991 /* BODY_RECOLOR_CYAN */,
    25486 /* BODY_RECOLOR_EMERALD */
  ];
  static recol1d = [
    [
      6798 /* HAIR_DARK_BROWN */,
      107 /* HAIR_WHITE */,
      10283 /* HAIR_LIGHT_GREY */,
      16 /* HAIR_DARK_GREY */,
      4797 /* HAIR_APRICOT */,
      7744 /* HAIR_STRAW */,
      5799 /* HAIR_LIGHT_BROWN */,
      4634 /* HAIR_BROWN */,
      33697 /* HAIR_TURQUOISE */,
      22433 /* HAIR_GREEN */,
      2983 /* HAIR_GINGER */,
      54193 /* HAIR_MAGENTA */
    ],
    [
      8741 /* BODY_KHAKI */,
      12 /* BODY_CHARCOAL */,
      64030 /* BODY_CRIMSON */,
      43162 /* BODY_NAVY */,
      7735 /* BODY_STRAW */,
      8404 /* BODY_WHITE */,
      1701 /* BODY_RED */,
      38430 /* BODY_BLUE */,
      24094 /* BODY_GREEN */,
      10153 /* BODY_YELLOW */,
      56621 /* BODY_PURPLE */,
      4783 /* BODY_ORANGE */,
      1341 /* BODY_ROSE */,
      16578 /* BODY_LIME */,
      35003 /* BODY_CYAN */,
      25239 /* BODY_EMERALD */
    ],
    [
      25239 /* BODY_EMERALD */ - 1,
      8741 /* BODY_KHAKI */ + 1,
      12 /* BODY_CHARCOAL */,
      64030 /* BODY_CRIMSON */,
      43162 /* BODY_NAVY */,
      7735 /* BODY_STRAW */,
      8404 /* BODY_WHITE */,
      1701 /* BODY_RED */,
      38430 /* BODY_BLUE */,
      24094 /* BODY_GREEN */,
      10153 /* BODY_YELLOW */,
      56621 /* BODY_PURPLE */,
      4783 /* BODY_ORANGE */,
      1341 /* BODY_ROSE */,
      16578 /* BODY_LIME */,
      35003 /* BODY_CYAN */
    ],
    [
      4626 /* FEET_BROWN */,
      11146 /* FEET_KHAKI */,
      6439 /* FEET_ASHEN */,
      12 /* FEET_DARK */,
      4758 /* FEET_TERRACOTTA */,
      10270 /* FEET_GREY */
    ],
    [
      4550 /* SKIN_DARKER */,
      4537 /* SKIN_DARKER_DARKER */,
      5681 /* SKIN_DARKER_DARKER_DARKER */,
      5673 /* SKIN_DARKER_DARKER_DARKER_DARKER */,
      5790 /* SKIN_DARKER_DARKER_DARKER_DARKER_DARKER */,
      6806 /* SKIN_DARKER_DARKER_DARKER_DARKER_DARKER_DARKER */,
      8076 /* SKIN_DARKER_DARKER_DARKER_DARKER_DARKER_DARKER_DARKER */,
      4574 /* SKIN */
    ]
  ];
  name = null;
  ready = false;
  gender = 0;
  headicons = 0;
  appearance = new Uint16Array(12);
  colour = new Uint16Array(5);
  combatLevel = 0;
  baseId = 0n;
  lowMem = false;
  static modelCache = new LruCache(200);
  y = 0;
  locStartCycle = 0;
  locStopCycle = 0;
  locOffsetX = 0;
  locOffsetY = 0;
  locOffsetZ = 0;
  locModel = null;
  minTileX = 0;
  minTileZ = 0;
  maxTileX = 0;
  maxTileZ = 0;
  setAppearance(buf) {
    buf.pos = 0;
    this.gender = buf.g1();
    this.headicons = buf.g1();
    for (let part = 0;part < 12; part++) {
      const msb = buf.g1();
      if (msb === 0) {
        this.appearance[part] = 0;
      } else {
        this.appearance[part] = (msb << 8) + buf.g1();
      }
    }
    for (let part = 0;part < 5; part++) {
      let colour = buf.g1();
      if (colour < 0 || colour >= ClientPlayer.recol1d[part].length) {
        colour = 0;
      }
      this.colour[part] = colour;
    }
    this.readyanim = buf.g2();
    if (this.readyanim === 65535) {
      this.readyanim = -1;
    }
    this.turnanim = buf.g2();
    if (this.turnanim === 65535) {
      this.turnanim = -1;
    }
    this.walkanim = buf.g2();
    if (this.walkanim === 65535) {
      this.walkanim = -1;
    }
    this.walkanim_b = buf.g2();
    if (this.walkanim_b === 65535) {
      this.walkanim_b = -1;
    }
    this.walkanim_l = buf.g2();
    if (this.walkanim_l === 65535) {
      this.walkanim_l = -1;
    }
    this.walkanim_r = buf.g2();
    if (this.walkanim_r === 65535) {
      this.walkanim_r = -1;
    }
    this.runanim = buf.g2();
    if (this.runanim === 65535) {
      this.runanim = -1;
    }
    this.name = JString.toScreenName(JString.toRawUsername(buf.g8()));
    this.combatLevel = buf.g1();
    this.ready = true;
    this.baseId = 0n;
    for (let part = 0;part < 12; part++) {
      this.baseId <<= 0x4n;
      if (this.appearance[part] >= 256) {
        this.baseId += BigInt(this.appearance[part]) - 256n;
      }
    }
    if (this.appearance[0] >= 256) {
      this.baseId += BigInt(this.appearance[0]) - 256n >> 4n;
    }
    if (this.appearance[1] >= 256) {
      this.baseId += BigInt(this.appearance[1]) - 256n >> 8n;
    }
    for (let part = 0;part < 5; part++) {
      this.baseId <<= 0x3n;
      this.baseId += BigInt(this.colour[part]);
    }
    this.baseId <<= 0x1n;
    this.baseId += BigInt(this.gender);
  }
  getTempModel(loopCycle) {
    if (!this.ready) {
      return null;
    }
    let model = this.getTempModel2();
    this.height = model.minY;
    model.useAABBMouseCheck = true;
    if (this.lowMem) {
      return model;
    }
    if (this.spotanimId != -1 && this.spotanimFrame != -1) {
      const spot = SpotType.list[this.spotanimId];
      const spotModel = spot.getTempModel2();
      const temp = Model.copyForAnim(spotModel, true, !spot.animateTransparencies, false);
      temp.translate(-this.spotanimHeight, 0, 0);
      temp.prepareAnim();
      if (spot.seq && spot.seq.frames) {
        temp.animate(spot.seq.frames[this.spotanimFrame]);
      }
      temp.labelFaces = null;
      temp.labelVertices = null;
      if (spot.resizeh != 128 || spot.resizev != 128) {
        temp.resize(spot.resizeh, spot.resizev, spot.resizeh);
      }
      temp.calculateNormals(spot.ambient + 64, spot.contrast + 850, -30, -50, -30, true);
      const models = [model, temp];
      model = Model.combine(models, 2);
    }
    if (this.locModel != null) {
      if (loopCycle >= this.locStopCycle) {
        this.locModel = null;
      }
      if (loopCycle >= this.locStartCycle && loopCycle < this.locStopCycle) {
        const loc = this.locModel;
        if (loc) {
          loc.translate(this.locOffsetY - this.y, this.locOffsetX - this.x, this.locOffsetZ - this.z);
          if (this.dstYaw == 512) {
            loc.rotate90();
            loc.rotate90();
            loc.rotate90();
          } else if (this.dstYaw == 1024) {
            loc.rotate90();
            loc.rotate90();
          } else if (this.dstYaw == 1536) {
            loc.rotate90();
          }
          const models = [model, loc];
          model = Model.combine(models, 2);
          if (this.dstYaw == 512) {
            loc.rotate90();
          } else if (this.dstYaw == 1024) {
            loc.rotate90();
            loc.rotate90();
          } else if (this.dstYaw == 1536) {
            loc.rotate90();
            loc.rotate90();
            loc.rotate90();
          }
          loc.translate(this.y - this.locOffsetY, this.x - this.locOffsetX, this.z - this.locOffsetZ);
        }
      }
    }
    model.useAABBMouseCheck = true;
    return model;
  }
  getTempModel2() {
    let hash = this.baseId;
    let primaryTransformId = -1;
    let secondaryTransformId = -1;
    let leftHandValue = -1;
    let rightHandValue = -1;
    if (this.primaryAnim >= 0 && this.primaryAnimDelay === 0) {
      const seq = SeqType.list[this.primaryAnim];
      if (seq.frames) {
        primaryTransformId = seq.frames[this.primaryAnimFrame];
      }
      if (this.secondaryAnim >= 0 && this.secondaryAnim !== this.readyanim) {
        const secondFrames = SeqType.list[this.secondaryAnim].frames;
        if (secondFrames) {
          secondaryTransformId = secondFrames[this.secondaryAnimFrame];
        }
      }
      if (seq.replaceheldleft >= 0) {
        leftHandValue = seq.replaceheldleft;
        hash += BigInt(leftHandValue - this.appearance[5]) << 8n;
      }
      if (seq.replaceheldright >= 0) {
        rightHandValue = seq.replaceheldright;
        hash += BigInt(rightHandValue - this.appearance[3]) << 16n;
      }
    } else if (this.secondaryAnim >= 0) {
      const secondFrames = SeqType.list[this.secondaryAnim].frames;
      if (secondFrames) {
        primaryTransformId = secondFrames[this.secondaryAnimFrame];
      }
    }
    let model = ClientPlayer.modelCache.find(hash);
    if (!model) {
      const models = new TypedArray1d(12, null);
      let modelCount = 0;
      for (let part = 0;part < 12; part++) {
        let value = this.appearance[part];
        if (rightHandValue >= 0 && part === 3) {
          value = rightHandValue;
        }
        if (leftHandValue >= 0 && part === 5) {
          value = leftHandValue;
        }
        if (value >= 256 && value < 512) {
          const idkModel = IdkType.list[value - 256].getModel();
          if (idkModel) {
            models[modelCount++] = idkModel;
          }
        }
        if (value >= 512) {
          const obj = ObjType.list(value - 512);
          const wornModel = obj.getWearModel(this.gender);
          if (wornModel) {
            models[modelCount++] = wornModel;
          }
        }
      }
      model = Model.combineForAnim(models, modelCount);
      for (let part = 0;part < 5; part++) {
        if (this.colour[part] === 0) {
          continue;
        }
        model.recolour(ClientPlayer.recol1d[part][0], ClientPlayer.recol1d[part][this.colour[part]]);
        if (part === 1) {
          model.recolour(ClientPlayer.recol2d[0], ClientPlayer.recol2d[this.colour[part]]);
        }
      }
      model.prepareAnim();
      model.calculateNormals(64, 850, -30, -50, -30, true);
      ClientPlayer.modelCache.put(hash, model);
    }
    if (this.lowMem) {
      return model;
    }
    const tmp = Model.set(model, true);
    if (primaryTransformId !== -1 && secondaryTransformId !== -1) {
      tmp.maskAnimate(primaryTransformId, secondaryTransformId, SeqType.list[this.primaryAnim].walkmerge);
    } else if (primaryTransformId !== -1) {
      tmp.animate(primaryTransformId);
    }
    tmp.calcBoundingCylinder();
    tmp.labelFaces = null;
    tmp.labelVertices = null;
    return tmp;
  }
  getHeadModel() {
    if (!this.ready) {
      return null;
    }
    const models = new TypedArray1d(12, null);
    let modelCount = 0;
    for (let part = 0;part < 12; part++) {
      const value = this.appearance[part];
      if (value >= 256 && value < 512) {
        models[modelCount++] = IdkType.list[value - 256].getHead();
      }
      if (value >= 512) {
        const headModel = ObjType.list(value - 512).getHeadModel(this.gender);
        if (headModel) {
          models[modelCount++] = headModel;
        }
      }
    }
    const tmp = Model.combineForAnim(models, modelCount);
    for (let part = 0;part < 5; part++) {
      if (this.colour[part] === 0) {
        continue;
      }
      tmp.recolour(ClientPlayer.recol1d[part][0], ClientPlayer.recol1d[part][this.colour[part]]);
      if (part === 1) {
        tmp.recolour(ClientPlayer.recol2d[0], ClientPlayer.recol2d[this.colour[part]]);
      }
    }
    return tmp;
  }
  isReady() {
    return this.ready;
  }
}

// src/dash3d/LocChange.ts
class LocChange extends Linkable {
  level = 0;
  layer = 0;
  x = 0;
  z = 0;
  oldType = 0;
  oldAngle = 0;
  oldShape = 0;
  newType = 0;
  newAngle = 0;
  newShape = 0;
  startTime = 0;
  endTime = -1;
}

// src/dash3d/ClientObj.ts
class ClientObj extends Linkable {
  id;
  count;
  constructor(id, count) {
    super();
    this.id = id;
    this.count = count;
  }
}

// src/dash3d/ClientProj.ts
class ClientProj extends ModelSource {
  spotanim;
  level;
  srcX;
  srcZ;
  h1;
  h2;
  t1;
  t2;
  angle;
  startpos;
  target;
  mobile = false;
  x = 0;
  z = 0;
  y = 0;
  velocityX = 0;
  velocityZ = 0;
  velocity = 0;
  velocityY = 0;
  accelerationY = 0;
  yaw = 0;
  pitch = 0;
  animFrame = 0;
  animCycle = 0;
  constructor(spotanim, level, srcX, h1, srcZ, t1, t2, angle, startpos, target, h2) {
    super();
    this.spotanim = SpotType.list[spotanim];
    this.level = level;
    this.srcX = srcX;
    this.srcZ = srcZ;
    this.h1 = h1;
    this.t1 = t1;
    this.t2 = t2;
    this.angle = angle;
    this.startpos = startpos;
    this.target = target;
    this.h2 = h2;
    this.mobile = false;
  }
  setTarget(dstX, dstY, dstZ, cycle) {
    if (!this.mobile) {
      const dx = dstX - this.srcX;
      const dz = dstZ - this.srcZ;
      const d = Math.sqrt(dx * dx + dz * dz);
      this.x = this.srcX + dx * this.startpos / d;
      this.z = this.srcZ + dz * this.startpos / d;
      this.y = this.h1;
    }
    const dt = this.t2 + 1 - cycle;
    this.velocityX = (dstX - this.x) / dt;
    this.velocityZ = (dstZ - this.z) / dt;
    this.velocity = Math.sqrt(this.velocityX * this.velocityX + this.velocityZ * this.velocityZ);
    if (!this.mobile) {
      this.velocityY = -this.velocity * Math.tan(this.angle * 0.02454369);
    }
    this.accelerationY = (dstY - this.y - this.velocityY * dt) * 2 / (dt * dt);
  }
  move(delta) {
    this.mobile = true;
    this.x += this.velocityX * delta;
    this.z += this.velocityZ * delta;
    this.y += this.velocityY * delta + this.accelerationY * 0.5 * delta * delta;
    this.velocityY += this.accelerationY * delta;
    this.yaw = (Math.atan2(this.velocityX, this.velocityZ) * 325.949 + 1024 | 0) & 2047;
    this.pitch = (Math.atan2(this.velocityY, this.velocity) * 325.949 | 0) & 2047;
    if (this.spotanim.seq && this.spotanim.seq.delay) {
      this.animCycle += delta;
      while (this.animCycle > this.spotanim.seq.delay[this.animFrame]) {
        this.animCycle -= this.spotanim.seq.delay[this.animFrame] + 1;
        this.animFrame++;
        if (this.animFrame >= this.spotanim.seq.numFrames) {
          this.animFrame = 0;
        }
      }
    }
  }
  getTempModel() {
    const spotModel = this.spotanim.getTempModel2();
    const model = Model.copyForAnim(spotModel, true, !this.spotanim.animateTransparencies, false);
    if (this.spotanim.seq && this.spotanim.seq.frames) {
      model.prepareAnim();
      model.animate(this.spotanim.seq.frames[this.animFrame]);
      model.labelFaces = null;
      model.labelVertices = null;
    }
    if (this.spotanim.resizeh !== 128 || this.spotanim.resizev !== 128) {
      model.resize(this.spotanim.resizeh, this.spotanim.resizev, this.spotanim.resizeh);
    }
    model.rotateXAxis(this.pitch);
    model.calculateNormals(64 + this.spotanim.ambient, 850 + this.spotanim.contrast, -30, -50, -30, true);
    return model;
  }
}

// src/dash3d/MapSpotAnim.ts
class MapSpotAnim extends ModelSource {
  type;
  level;
  x;
  z;
  y;
  startCycle;
  animComplete = false;
  animFrame = 0;
  animCycle = 0;
  constructor(id, level, x, z, y, cycle, delay) {
    super();
    this.type = SpotType.list[id];
    this.level = level;
    this.x = x;
    this.z = z;
    this.y = y;
    this.startCycle = cycle + delay;
  }
  update(delta) {
    if (!this.type.seq || !this.type.seq.delay) {
      return;
    }
    for (this.animCycle += delta;this.animCycle > this.type.seq.delay[this.animFrame]; ) {
      this.animCycle -= this.type.seq.delay[this.animFrame] + 1;
      this.animFrame++;
      if (this.animFrame >= this.type.seq.numFrames) {
        this.animFrame = 0;
        this.animComplete = true;
      }
    }
  }
  getTempModel() {
    const tmp = this.type.getTempModel2();
    const model = Model.copyForAnim(tmp, true, !this.type.animateTransparencies, false);
    if (!this.animComplete && this.type.seq && this.type.seq.frames) {
      model.prepareAnim();
      model.animate(this.type.seq.frames[this.animFrame]);
      model.labelFaces = null;
      model.labelVertices = null;
    }
    if (this.type.resizeh !== 128 || this.type.resizev !== 128) {
      model.resize(this.type.resizeh, this.type.resizev, this.type.resizeh);
    }
    if (this.type.angle !== 0) {
      if (this.type.angle === 90) {
        model.rotate90();
      } else if (this.type.angle === 180) {
        model.rotate90();
        model.rotate90();
      } else if (this.type.angle === 270) {
        model.rotate90();
        model.rotate90();
        model.rotate90();
      }
    }
    model.calculateNormals(64 + this.type.ambient, 850 + this.type.contrast, -30, -50, -30, true);
    return model;
  }
}

// src/util/JavaRandom.ts
var p2_16 = 65536;
var p2_24 = 16777216;
var p2_27 = 134217728;
var p2_31 = 2147483648;
var p2_32 = 4294967296;
var p2_48 = 281474976710656;
var p2_53 = Math.pow(2, 53);
var m2_16 = 65535;
var [c2, c1, c0] = [5, 57068, 58989];
var s2 = 0;
var s1 = 0;
var s0 = 0;
function _next() {
  let carry = 11;
  let r0 = s0 * c0 + carry;
  carry = r0 >>> 16;
  r0 &= m2_16;
  let r1 = s1 * c0 + s0 * c1 + carry;
  carry = r1 >>> 16;
  r1 &= m2_16;
  let r2 = s2 * c0 + s1 * c1 + s0 * c2 + carry;
  r2 &= m2_16;
  [s2, s1, s0] = [r2, r1, r0];
  return s2 * p2_16 + s1;
}
function next_signed(bits) {
  return _next() >> 32 - bits;
}
function next(bits) {
  return _next() >>> 32 - bits;
}
function checkIsPositiveInt(n, r = Number.MAX_SAFE_INTEGER) {
  if (n < 0 || n > r) {
    throw RangeError("number must be > 0");
  }
}

class JavaRandom {
  constructor(seedval) {
    if (typeof seedval === "undefined") {
      seedval = Math.floor(Math.random() * p2_48);
    }
    this.setSeed(seedval);
  }
  setSeed(n) {
    checkIsPositiveInt(n);
    s0 = n & m2_16 ^ c0;
    s1 = n / p2_16 & m2_16 ^ c1;
    s2 = n / p2_32 & m2_16 ^ c2;
  }
  nextInt(bound) {
    if (bound === undefined) {
      return next_signed(32);
    }
    checkIsPositiveInt(bound, 2147483647);
    if ((bound & -bound) === bound) {
      const r = next(31) / p2_31;
      return ~~(bound * r);
    }
    let bits, val;
    do {
      bits = next(31);
      val = bits % bound;
    } while (bits - val + (bound - 1) < 0);
    return val;
  }
  nextLong() {
    const msb = BigInt(next_signed(32));
    const lsb = BigInt(next_signed(32));
    const p2_32n = BigInt(p2_32);
    return msb * p2_32n + lsb;
  }
  nextBoolean() {
    return next(1) != 0;
  }
  nextFloat() {
    return next(24) / p2_24;
  }
  nextDouble() {
    return (p2_27 * next(26) + next(27)) / p2_53;
  }
}

// src/graphics/PixFont.ts
class PixFont extends Linkable2 {
  static CHARSET = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"£$%^&*()-_=+[{]};:'@#~,<.>/?\\| `;
  static CHARCODESET = [];
  charMask = [];
  charMaskWidth = new Int32Array(94);
  charMaskHeight = new Int32Array(94);
  charOffsetX = new Int32Array(94);
  charOffsetY = new Int32Array(94);
  charAdvance = new Int32Array(95);
  drawWidth = new Int32Array(256);
  rand = new JavaRandom(Date.now());
  height = 0;
  static {
    const isCapacitor = navigator.userAgent.includes("Capacitor");
    for (let i = 0;i < 256; i++) {
      let c = PixFont.CHARSET.indexOf(String.fromCharCode(i));
      if (isCapacitor) {
        if (c >= 63) {
          c--;
        }
      }
      if (c === -1) {
        c = 74;
      }
      PixFont.CHARCODESET[i] = c;
    }
  }
  static depack(archive, name) {
    const dat = new Packet(archive.read(name + ".dat"));
    const idx = new Packet(archive.read("index.dat"));
    idx.pos = dat.g2() + 4;
    const palCount = idx.g1();
    if (palCount > 0) {
      idx.pos += (palCount - 1) * 3;
    }
    const font = new PixFont;
    for (let i = 0;i < 94; i++) {
      font.charOffsetX[i] = idx.g1();
      font.charOffsetY[i] = idx.g1();
      const wi = font.charMaskWidth[i] = idx.g2();
      const hi = font.charMaskHeight[i] = idx.g2();
      const pixelOrder = idx.g1();
      const len = wi * hi;
      font.charMask[i] = new Int8Array(len);
      if (pixelOrder === 0) {
        for (let j = 0;j < wi * hi; j++) {
          font.charMask[i][j] = dat.g1b();
        }
      } else if (pixelOrder === 1) {
        for (let x = 0;x < wi; x++) {
          for (let y = 0;y < hi; y++) {
            font.charMask[i][x + y * wi] = dat.g1b();
          }
        }
      }
      if (hi > font.height) {
        font.height = hi;
      }
      font.charOffsetX[i] = 1;
      font.charAdvance[i] = wi + 2;
      {
        let space = 0;
        for (let y = hi / 7 | 0;y < hi; y++) {
          space += font.charMask[i][y * wi];
        }
        if (space <= (hi / 7 | 0)) {
          font.charAdvance[i]--;
          font.charOffsetX[i] = 0;
        }
      }
      {
        let space = 0;
        for (let y = hi / 7 | 0;y < hi; y++) {
          space += font.charMask[i][wi + y * wi - 1];
        }
        if (space <= (hi / 7 | 0)) {
          font.charAdvance[i]--;
        }
      }
    }
    font.charAdvance[94] = font.charAdvance[8];
    for (let i = 0;i < 256; i++) {
      font.drawWidth[i] = font.charAdvance[PixFont.CHARCODESET[i]];
    }
    return font;
  }
  centreString(x, y, str, rgb) {
    if (str === null) {
      return;
    }
    x |= 0;
    y |= 0;
    this.drawString(x - (this.stringWid(str) / 2 | 0), y, str, rgb);
  }
  centreStringTag(x, y, str, rgb, shadowed) {
    x |= 0;
    y |= 0;
    this.drawStringTag(x - (this.stringWid(str) / 2 | 0), y, str, rgb, shadowed);
  }
  stringWid(str) {
    if (str === null) {
      return 0;
    }
    const length = str.length;
    let w = 0;
    for (let i = 0;i < length; i++) {
      if (str.charAt(i) === "@" && i + 4 < length && str.charAt(i + 4) === "@") {
        i += 4;
      } else {
        w += this.drawWidth[str.charCodeAt(i)];
      }
    }
    return w;
  }
  drawString(x, y, str, rgb) {
    if (!str) {
      return;
    }
    x |= 0;
    y |= 0;
    y -= this.height;
    for (let i = 0;i < str.length; i++) {
      const c = PixFont.CHARCODESET[str.charCodeAt(i)];
      if (c !== 94) {
        this.plotLetter(this.charMask[c], x + this.charOffsetX[c], y + this.charOffsetY[c], this.charMaskWidth[c], this.charMaskHeight[c], rgb);
      }
      x += this.charAdvance[c];
    }
  }
  centreStringWave(x, y, str, rgb, phase) {
    if (str === null) {
      return;
    }
    x |= 0;
    y |= 0;
    x -= this.stringWid(str) / 2 | 0;
    const offY = y - this.height;
    for (let i = 0;i < str.length; i++) {
      const c = PixFont.CHARCODESET[str.charCodeAt(i)];
      if (c != 94) {
        this.plotLetter(this.charMask[c], x + this.charOffsetX[c], offY + this.charOffsetY[c] + (Math.sin(i / 2 + phase / 5) * 5 | 0), this.charMaskWidth[c], this.charMaskHeight[c], rgb);
      }
      x += this.charAdvance[c];
    }
  }
  drawStringTag(x, y, str, rgb, shadowed) {
    x |= 0;
    y |= 0;
    const length = str.length;
    y -= this.height;
    for (let i = 0;i < length; i++) {
      if (str.charAt(i) === "@" && i + 4 < length && str.charAt(i + 4) === "@") {
        rgb = this.updateState(str.substring(i + 1, i + 4));
        i += 4;
      } else {
        const c = PixFont.CHARCODESET[str.charCodeAt(i)];
        if (c !== 94) {
          if (shadowed) {
            this.plotLetter(this.charMask[c], x + this.charOffsetX[c] + 1, y + this.charOffsetY[c] + 1, this.charMaskWidth[c], this.charMaskHeight[c], 0 /* BLACK */);
          }
          this.plotLetter(this.charMask[c], x + this.charOffsetX[c], y + this.charOffsetY[c], this.charMaskWidth[c], this.charMaskHeight[c], rgb);
        }
        x += this.charAdvance[c];
      }
    }
  }
  drawStringAntiMacro(x, y, str, rgb, shadowed, seed) {
    x |= 0;
    y |= 0;
    this.rand.setSeed(seed);
    const rand = (this.rand.nextInt() & 31) + 192;
    const offY = y - this.height;
    for (let i = 0;i < str.length; i++) {
      if (str.charAt(i) === "@" && i + 4 < str.length && str.charAt(i + 4) === "@") {
        rgb = this.updateState(str.substring(i + 1, i + 4));
        i += 4;
      } else {
        const c = PixFont.CHARCODESET[str.charCodeAt(i)];
        if (c !== 94) {
          if (shadowed) {
            this.plotLetterTrans(x + this.charOffsetX[c] + 1, offY + this.charOffsetY[c] + 1, this.charMaskWidth[c], this.charMaskHeight[c], 0 /* BLACK */, 192, this.charMask[c]);
          }
          this.plotLetterTrans(x + this.charOffsetX[c], offY + this.charOffsetY[c], this.charMaskWidth[c], this.charMaskHeight[c], rgb, rand, this.charMask[c]);
        }
        x += this.charAdvance[c];
        if ((this.rand.nextInt() & 3) === 0) {
          x++;
        }
      }
    }
  }
  updateState(tag) {
    if (tag === "red") {
      return 16711680 /* RED */;
    } else if (tag === "gre") {
      return 65280 /* GREEN */;
    } else if (tag === "blu") {
      return 255 /* BLUE */;
    } else if (tag === "yel") {
      return 16776960 /* YELLOW */;
    } else if (tag === "cya") {
      return 65535 /* CYAN */;
    } else if (tag === "mag") {
      return 16711935 /* MAGENTA */;
    } else if (tag === "whi") {
      return 16777215 /* WHITE */;
    } else if (tag === "bla") {
      return 0 /* BLACK */;
    } else if (tag === "lre") {
      return 16748608 /* LIGHTRED */;
    } else if (tag === "dre") {
      return 8388608 /* DARKRED */;
    } else if (tag === "dbl") {
      return 128 /* DARKBLUE */;
    } else if (tag === "or1") {
      return 16756736 /* ORANGE1 */;
    } else if (tag === "or2") {
      return 16740352 /* ORANGE2 */;
    } else if (tag === "or3") {
      return 16723968 /* ORANGE3 */;
    } else if (tag === "gr1") {
      return 12648192 /* GREEN1 */;
    } else if (tag === "gr2") {
      return 8453888 /* GREEN2 */;
    } else if (tag === "gr3") {
      return 4259584 /* GREEN3 */;
    } else {
      return 0 /* BLACK */;
    }
  }
  drawStringRight(x, y, str, rgb, shadowed = true) {
    x |= 0;
    y |= 0;
    if (shadowed) {
      this.drawString(x - this.stringWid(str) + 1, y + 1, str, 0 /* BLACK */);
    }
    this.drawString(x - this.stringWid(str), y, str, rgb);
  }
  plotLetter(data, x, y, w, h, rgb) {
    x |= 0;
    y |= 0;
    w |= 0;
    h |= 0;
    let dstOff = x + y * Pix2D.width;
    let dstStep = Pix2D.width - w;
    let srcStep = 0;
    let srcOff = 0;
    if (y < Pix2D.clipMinY) {
      const cutoff = Pix2D.clipMinY - y;
      h -= cutoff;
      y = Pix2D.clipMinY;
      srcOff += cutoff * w;
      dstOff += cutoff * Pix2D.width;
    }
    if (y + h >= Pix2D.clipMaxY) {
      h -= y + h + 1 - Pix2D.clipMaxY;
    }
    if (x < Pix2D.clipMinX) {
      const cutoff = Pix2D.clipMinX - x;
      w -= cutoff;
      x = Pix2D.clipMinX;
      srcOff += cutoff;
      dstOff += cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }
    if (x + w >= Pix2D.clipMaxX) {
      const cutoff = x + w + 1 - Pix2D.clipMaxX;
      w -= cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }
    if (w > 0 && h > 0) {
      this.plot(w, h, data, srcOff, srcStep, Pix2D.pixels, dstOff, dstStep, rgb);
    }
  }
  plot(w, h, src, srcOff, srcStep, dst, dstOff, dstStep, rgb) {
    w |= 0;
    h |= 0;
    const hw = -(w >> 2);
    w = -(w & 3);
    for (let y = -h;y < 0; y++) {
      for (let x = hw;x < 0; x++) {
        if (src[srcOff++] === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
        if (src[srcOff++] === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
        if (src[srcOff++] === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
        if (src[srcOff++] === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
      }
      for (let x = w;x < 0; x++) {
        if (src[srcOff++] === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
      }
      dstOff += dstStep;
      srcOff += srcStep;
    }
  }
  plotLetterTrans(x, y, w, h, rgb, alpha, mask) {
    x |= 0;
    y |= 0;
    w |= 0;
    h |= 0;
    let dstOff = x + y * Pix2D.width;
    let dstStep = Pix2D.width - w;
    let srcStep = 0;
    let srcOff = 0;
    if (y < Pix2D.clipMinY) {
      const cutoff = Pix2D.clipMinY - y;
      h -= cutoff;
      y = Pix2D.clipMinY;
      srcOff += cutoff * w;
      dstOff += cutoff * Pix2D.width;
    }
    if (y + h >= Pix2D.clipMaxY) {
      h -= y + h + 1 - Pix2D.clipMaxY;
    }
    if (x < Pix2D.clipMinX) {
      const cutoff = Pix2D.clipMinX - x;
      w -= cutoff;
      x = Pix2D.clipMinX;
      srcOff += cutoff;
      dstOff += cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }
    if (x + w >= Pix2D.clipMaxX) {
      const cutoff = x + w + 1 - Pix2D.clipMaxX;
      w -= cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }
    if (w > 0 && h > 0) {
      this.plotTrans(w, h, Pix2D.pixels, dstOff, dstStep, mask, srcOff, srcStep, rgb, alpha);
    }
  }
  plotTrans(w, h, dst, dstOff, dstStep, src, srcOff, srcStep, rgb, alpha) {
    w |= 0;
    h |= 0;
    const mixed = ((rgb & 16711935) * alpha & 4278255360) + ((rgb & 65280) * alpha & 16711680) >> 8;
    const invAlpha = 256 - alpha;
    for (let y = -h;y < 0; y++) {
      for (let x = -w;x < 0; x++) {
        if (src[srcOff++] === 0) {
          dstOff++;
        } else {
          const dstRgb = dst[dstOff];
          dst[dstOff++] = (((dstRgb & 16711935) * invAlpha & 4278255360) + ((dstRgb & 65280) * invAlpha & 16711680) >> 8) + mixed;
        }
      }
      dstOff += dstStep;
      srcOff += srcStep;
    }
  }
}

// src/io/ClientStream.ts
class ClientStream {
  socket;
  wsin;
  wsout;
  closed = false;
  ioerror = false;
  static async openSocket(host, secured) {
    return await new Promise((resolve, reject) => {
      const protocol = secured ? "wss" : "ws";
      const ws = new WebSocket(`${protocol}://${host}`, "binary");
      ws.addEventListener("open", () => {
        resolve(ws);
      });
      ws.addEventListener("error", () => {
        reject(ws);
      });
    });
  }
  constructor(socket) {
    socket.onclose = this.onclose;
    socket.onerror = this.onerror;
    this.wsin = new WebSocketReader(socket, 5000);
    this.wsout = new WebSocketWriter(socket, 5000);
    this.socket = socket;
  }
  get host() {
    return this.socket.url.split("/")[2];
  }
  get port() {
    return parseInt(this.socket.url.split(":")[2], 10);
  }
  get available() {
    return this.closed ? 0 : this.wsin.available;
  }
  write(src, len) {
    if (!this.closed) {
      this.wsout.write(src, len);
    }
  }
  async read() {
    return this.closed ? 0 : await this.wsin.read();
  }
  async readBytes(dst, off, len) {
    if (this.closed) {
      return;
    }
    await this.wsin.readBytes(dst, off, len);
  }
  close() {
    this.closed = true;
    this.socket.close();
    this.wsin.close();
    this.wsout.close();
  }
  onclose = (_event) => {
    if (this.closed) {
      return;
    }
    this.close();
  };
  onerror = (_event) => {
    if (this.closed) {
      return;
    }
    this.ioerror = true;
    this.close();
  };
}

class WebSocketWriter {
  socket;
  limit;
  closed = false;
  ioerror = false;
  constructor(socket, limit) {
    this.socket = socket;
    this.limit = limit;
  }
  write(src, len) {
    if (this.closed) {
      return;
    }
    if (this.ioerror) {
      this.ioerror = false;
      throw new Error;
    }
    if (len > this.limit || src.length > this.limit) {
      throw new Error;
    }
    try {
      this.socket.send(src.slice(0, len));
    } catch (_e) {
      this.ioerror = true;
    }
  }
  close() {
    this.closed = true;
  }
}

class WebSocketEvent {
  bytes;
  position;
  constructor(bytes) {
    this.bytes = bytes;
    this.position = 0;
  }
  get available() {
    return this.bytes.length - this.position;
  }
  get read() {
    return this.bytes[this.position++];
  }
  get len() {
    return this.bytes.length;
  }
}

class WebSocketReader {
  limit;
  queue = [];
  event = null;
  callback = null;
  closed = false;
  total = 0;
  constructor(socket, limit) {
    this.limit = limit;
    socket.binaryType = "arraybuffer";
    socket.onmessage = this.onmessage;
  }
  get available() {
    return this.total;
  }
  onmessage = (e) => {
    if (this.closed) {
      throw new Error;
    }
    const event = new WebSocketEvent(new Uint8Array(e.data));
    this.total += event.available;
    if (this.callback) {
      const cb = this.callback;
      this.callback = null;
      cb(event);
    } else {
      this.queue.push(event);
    }
  };
  async read() {
    if (this.closed) {
      throw new Error;
    }
    return await Promise.race([
      new Promise((resolve) => {
        if (!this.event || this.event.available === 0) {
          this.event = this.queue.shift() ?? null;
        }
        if (this.event && this.event.available > 0) {
          resolve(this.event.read);
          this.total--;
        } else {
          this.callback = (event) => {
            this.event = event;
            this.total--;
            resolve(event.read);
          };
        }
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          if (this.closed) {
            reject(new Error);
          } else {
            reject(new Error);
          }
        }, 20000);
      })
    ]);
  }
  async readBytes(dst, off, len) {
    if (this.closed) {
      throw new Error;
    }
    for (let i = 0;i < len; i++) {
      dst[off + i] = await this.read();
    }
    return dst;
  }
  close() {
    this.closed = true;
    this.callback = null;
    this.event = null;
    this.queue = [];
  }
}

// src/io/Database.ts
class Database {
  db;
  constructor(db) {
    db.onerror = this.onerror;
    db.onclose = this.onclose;
    this.db = db;
  }
  static async openDatabase() {
    return await new Promise((resolve, reject) => {
      const request = indexedDB.open("lostcity", 1);
      request.onsuccess = (event) => {
        const target = event.target;
        resolve(target.result);
      };
      request.onupgradeneeded = (event) => {
        const target = event.target;
        target.result.createObjectStore("cache");
      };
      request.onerror = (event) => {
        const target = event.target;
        reject(target.result);
      };
    });
  }
  async cacheload(name) {
    return await new Promise((resolve) => {
      const transaction = this.db.transaction("cache", "readonly");
      const store = transaction.objectStore("cache");
      const request = store.get(name);
      request.onsuccess = () => {
        if (request.result) {
          resolve(new Uint8Array(request.result));
        } else {
          resolve(undefined);
        }
      };
      request.onerror = () => {
        resolve(undefined);
      };
    });
  }
  async cachesave(name, src) {
    if (src === null) {
      return;
    }
    return await new Promise((resolve, _reject) => {
      const transaction = this.db.transaction("cache", "readwrite");
      const store = transaction.objectStore("cache");
      const request = store.put(src, name);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        resolve();
      };
    });
  }
  onclose = (_event) => {};
  onerror = (_event) => {};
}

// src/io/Isaac.ts
class Isaac {
  count = 0;
  rsl = new Int32Array(256);
  mem = new Int32Array(256);
  a = 0;
  b = 0;
  c = 0;
  constructor(seed) {
    for (let i = 0;i < seed.length; i++) {
      this.rsl[i] = seed[i];
    }
    this.init();
  }
  get nextInt() {
    if (this.count-- === 0) {
      this.isaac();
      this.count = 255;
    }
    return this.rsl[this.count];
  }
  init() {
    let a = 2654435769, b = 2654435769, c = 2654435769, d = 2654435769, e = 2654435769, f = 2654435769, g = 2654435769, h = 2654435769;
    for (let i = 0;i < 4; i++) {
      a ^= b << 11;
      d += a;
      b += c;
      b ^= c >>> 2;
      e += b;
      c += d;
      c ^= d << 8;
      f += c;
      d += e;
      d ^= e >>> 16;
      g += d;
      e += f;
      e ^= f << 10;
      h += e;
      f += g;
      f ^= g >>> 4;
      a += f;
      g += h;
      g ^= h << 8;
      b += g;
      h += a;
      h ^= a >>> 9;
      c += h;
      a += b;
    }
    for (let i = 0;i < 256; i += 8) {
      a += this.rsl[i];
      b += this.rsl[i + 1];
      c += this.rsl[i + 2];
      d += this.rsl[i + 3];
      e += this.rsl[i + 4];
      f += this.rsl[i + 5];
      g += this.rsl[i + 6];
      h += this.rsl[i + 7];
      a ^= b << 11;
      d += a;
      b += c;
      b ^= c >>> 2;
      e += b;
      c += d;
      c ^= d << 8;
      f += c;
      d += e;
      d ^= e >>> 16;
      g += d;
      e += f;
      e ^= f << 10;
      h += e;
      f += g;
      f ^= g >>> 4;
      a += f;
      g += h;
      g ^= h << 8;
      b += g;
      h += a;
      h ^= a >>> 9;
      c += h;
      a += b;
      this.mem[i] = a;
      this.mem[i + 1] = b;
      this.mem[i + 2] = c;
      this.mem[i + 3] = d;
      this.mem[i + 4] = e;
      this.mem[i + 5] = f;
      this.mem[i + 6] = g;
      this.mem[i + 7] = h;
    }
    for (let i = 0;i < 256; i += 8) {
      a += this.mem[i];
      b += this.mem[i + 1];
      c += this.mem[i + 2];
      d += this.mem[i + 3];
      e += this.mem[i + 4];
      f += this.mem[i + 5];
      g += this.mem[i + 6];
      h += this.mem[i + 7];
      a ^= b << 11;
      d += a;
      b += c;
      b ^= c >>> 2;
      e += b;
      c += d;
      c ^= d << 8;
      f += c;
      d += e;
      d ^= e >>> 16;
      g += d;
      e += f;
      e ^= f << 10;
      h += e;
      f += g;
      f ^= g >>> 4;
      a += f;
      g += h;
      g ^= h << 8;
      b += g;
      h += a;
      h ^= a >>> 9;
      c += h;
      a += b;
      this.mem[i] = a;
      this.mem[i + 1] = b;
      this.mem[i + 2] = c;
      this.mem[i + 3] = d;
      this.mem[i + 4] = e;
      this.mem[i + 5] = f;
      this.mem[i + 6] = g;
      this.mem[i + 7] = h;
    }
    this.isaac();
    this.count = 256;
  }
  isaac() {
    this.c++;
    this.b += this.c;
    for (let i = 0;i < 256; i++) {
      const x = this.mem[i];
      const mem = i & 3;
      if (mem === 0) {
        this.a ^= this.a << 13;
      } else if (mem === 1) {
        this.a ^= this.a >>> 6;
      } else if (mem === 2) {
        this.a ^= this.a << 2;
      } else if (mem === 3) {
        this.a ^= this.a >>> 16;
      }
      this.a += this.mem[i + 128 & 255];
      let y;
      this.mem[i] = y = this.mem[x >>> 2 & 255] + this.a + this.b;
      this.rsl[i] = this.b = this.mem[y >>> 8 >>> 2 & 255] + x;
    }
  }
}

// src/io/JagFile.ts
class JagFile {
  static genHash(name) {
    let hash = 0;
    name = name.toUpperCase();
    for (let i = 0;i < name.length; i++) {
      hash = hash * 61 + name.charCodeAt(i) - 32 | 0;
    }
    return hash;
  }
  data;
  unpacked;
  fileCount;
  fileHash;
  fileUnpackedSize;
  filePackedSize;
  fileOffset;
  fileUnpacked = [];
  constructor(src) {
    let data = new Packet(new Uint8Array(src));
    const unpackedSize = data.g3();
    const packedSize = data.g3();
    if (unpackedSize === packedSize) {
      this.data = src;
      this.unpacked = false;
    } else {
      this.data = bzip2_wasm_default.decompress(src.subarray(6), unpackedSize, true);
      data = new Packet(new Uint8Array(this.data));
      this.unpacked = true;
    }
    this.fileCount = data.g2();
    this.fileHash = [];
    this.fileUnpackedSize = [];
    this.filePackedSize = [];
    this.fileOffset = [];
    let offset = data.pos + this.fileCount * 10;
    for (let i = 0;i < this.fileCount; i++) {
      this.fileHash.push(data.g4());
      this.fileUnpackedSize.push(data.g3());
      this.filePackedSize.push(data.g3());
      this.fileOffset.push(offset);
      offset += this.filePackedSize[i];
    }
  }
  read(name) {
    const hash = JagFile.genHash(name);
    const index = this.fileHash.indexOf(hash);
    if (index === -1) {
      return null;
    }
    return this.readIndex(index);
  }
  readIndex(index) {
    if (index < 0 || index >= this.fileCount) {
      return null;
    }
    if (this.fileUnpacked[index]) {
      return this.fileUnpacked[index];
    }
    const offset = this.fileOffset[index];
    const length = this.filePackedSize[index];
    const src = new Uint8Array(this.data.subarray(offset, offset + length));
    if (this.unpacked) {
      this.fileUnpacked[index] = src;
      return src;
    } else {
      const data = bzip2_wasm_default.decompress(src, this.fileUnpackedSize[index], true);
      this.fileUnpacked[index] = data;
      return data;
    }
  }
}

// src/io/ServerProt.ts
var ServerProtSizes = [
  0,
  -2,
  4,
  6,
  -1,
  0,
  0,
  2,
  0,
  0,
  0,
  0,
  5,
  4,
  2,
  2,
  0,
  0,
  0,
  0,
  2,
  -2,
  2,
  14,
  0,
  6,
  3,
  0,
  4,
  0,
  0,
  0,
  3,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  -1,
  4,
  2,
  6,
  0,
  6,
  0,
  0,
  3,
  7,
  0,
  0,
  0,
  -1,
  0,
  0,
  0,
  0,
  4,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  15,
  0,
  0,
  0,
  0,
  6,
  0,
  2,
  0,
  0,
  0,
  2,
  0,
  0,
  0,
  1,
  0,
  0,
  4,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  -2,
  0,
  0,
  0,
  0,
  6,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  0,
  -2,
  0,
  0,
  2,
  0,
  0,
  0,
  2,
  9,
  0,
  0,
  0,
  0,
  0,
  4,
  0,
  0,
  0,
  3,
  7,
  9,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  -2,
  0,
  0,
  0,
  0,
  3,
  2,
  0,
  0,
  0,
  0,
  0,
  0,
  6,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  -2,
  2,
  0,
  0,
  0,
  0,
  0,
  6,
  0,
  0,
  0,
  2,
  0,
  2,
  0,
  0,
  0,
  -2,
  0,
  0,
  4,
  0,
  0,
  0,
  0,
  6,
  0,
  0,
  -2,
  -2,
  0,
  0,
  0,
  0,
  0,
  0,
  -2,
  0,
  0,
  5,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  -2,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  0
];

// src/wordfilter/WordFilter.ts
class WordFilter {
  static PERIOD = new Uint16Array(["d", "o", "t"].join("").split("").map((char) => char.charCodeAt(0)));
  static AMPERSAT = new Uint16Array(["(", "a", ")"].join("").split("").map((char) => char.charCodeAt(0)));
  static SLASH = new Uint16Array(["s", "l", "a", "s", "h"].join("").split("").map((char) => char.charCodeAt(0)));
  static whitelist = ["cook", "cook's", "cooks", "seeks", "sheet"];
  static tlds = [];
  static tldTypes = [];
  static bads = [];
  static badCombinations = [];
  static domains = [];
  static fragments = [];
  static unpack(wordenc) {
    const fragments = new Packet(wordenc.read("fragmentsenc.txt"));
    const bad = new Packet(wordenc.read("badenc.txt"));
    const domain = new Packet(wordenc.read("domainenc.txt"));
    const tld = new Packet(wordenc.read("tldlist.txt"));
    this.read(bad, domain, fragments, tld);
  }
  static filter(input) {
    const characters = [...input];
    this.format(characters);
    const trimmed = characters.join("").trim();
    const lowercase = trimmed.toLowerCase();
    const filtered = [...lowercase];
    this.filterTlds(filtered);
    this.filterBadWords(filtered);
    this.filterDomains(filtered);
    this.filterFragments(filtered);
    for (let index = 0;index < this.whitelist.length; index++) {
      let offset = -1;
      while ((offset = lowercase.indexOf(this.whitelist[index], offset + 1)) !== -1) {
        const whitelisted = [...this.whitelist[index]];
        for (let charIndex = 0;charIndex < whitelisted.length; charIndex++) {
          filtered[charIndex + offset] = whitelisted[charIndex];
        }
      }
    }
    this.replaceUppercases(filtered, [...trimmed]);
    this.formatUppercases(filtered);
    return filtered.join("").trim();
  }
  static read(bad, domain, fragments, tld) {
    this.readBadWords(bad);
    this.readDomains(domain);
    this.readFragments(fragments);
    this.readTld(tld);
  }
  static readTld(packet) {
    const count = packet.g4();
    for (let index = 0;index < count; index++) {
      this.tldTypes[index] = packet.g1();
      this.tlds[index] = new Uint16Array(packet.g1()).map(() => packet.g1());
    }
  }
  static readBadWords(packet) {
    const count = packet.g4();
    for (let index = 0;index < count; index++) {
      this.bads[index] = new Uint16Array(packet.g1()).map(() => packet.g1());
      const combos = new Array(packet.g1()).fill([]).map(() => [packet.g1b(), packet.g1b()]);
      if (combos.length > 0) {
        this.badCombinations[index] = combos;
      }
    }
  }
  static readDomains(packet) {
    const count = packet.g4();
    for (let index = 0;index < count; index++) {
      this.domains[index] = new Uint16Array(packet.g1()).map(() => packet.g1());
    }
  }
  static readFragments(packet) {
    const count = packet.g4();
    for (let index = 0;index < count; index++) {
      this.fragments[index] = packet.g2();
    }
  }
  static filterTlds(chars) {
    const period = [...chars];
    const slash = [...chars];
    this.filterBadCombinations(null, period, this.PERIOD);
    this.filterBadCombinations(null, slash, this.SLASH);
    for (let index = 0;index < this.tlds.length; index++) {
      this.filterTld(slash, this.tldTypes[index], chars, this.tlds[index], period);
    }
  }
  static filterBadWords(chars) {
    for (let comboIndex = 0;comboIndex < 2; comboIndex++) {
      for (let index = this.bads.length - 1;index >= 0; index--) {
        this.filterBadCombinations(this.badCombinations[index], chars, this.bads[index]);
      }
    }
  }
  static filterDomains(chars) {
    const ampersat = [...chars];
    const period = [...chars];
    this.filterBadCombinations(null, ampersat, this.AMPERSAT);
    this.filterBadCombinations(null, period, this.PERIOD);
    for (let index = this.domains.length - 1;index >= 0; index--) {
      this.filterDomain(period, ampersat, this.domains[index], chars);
    }
  }
  static filterFragments(chars) {
    for (let currentIndex = 0;currentIndex < chars.length; ) {
      const numberIndex = this.indexOfNumber(chars, currentIndex);
      if (numberIndex === -1) {
        return;
      }
      let isSymbolOrNotLowercaseAlpha = false;
      for (let index = currentIndex;index >= 0 && index < numberIndex && !isSymbolOrNotLowercaseAlpha; index++) {
        if (!this.isSymbol(chars[index]) && !this.isNotLowercaseAlpha(chars[index])) {
          isSymbolOrNotLowercaseAlpha = true;
        }
      }
      let startIndex = 0;
      if (isSymbolOrNotLowercaseAlpha) {
        startIndex = 0;
      }
      if (startIndex === 0) {
        startIndex = 1;
        currentIndex = numberIndex;
      }
      let value = 0;
      for (let index = numberIndex;index < chars.length && index < currentIndex; index++) {
        value = value * 10 + chars[index].charCodeAt(0) - 48;
      }
      if (value <= 255 && currentIndex - numberIndex <= 8) {
        startIndex++;
      } else {
        startIndex = 0;
      }
      if (startIndex === 4) {
        this.maskChars(numberIndex, currentIndex, chars);
        startIndex = 0;
      }
      currentIndex = this.indexOfNonNumber(currentIndex, chars);
    }
  }
  static isBadFragment(chars) {
    if (this.isNumericalChars(chars)) {
      return true;
    }
    const value = this.getInteger(chars);
    const fragments = this.fragments;
    const fragmentsLength = fragments.length;
    if (value === fragments[0] || value === fragments[fragmentsLength - 1]) {
      return true;
    }
    let start = 0;
    let end = fragmentsLength - 1;
    while (start <= end) {
      const mid = (start + end) / 2 | 0;
      if (value === fragments[mid]) {
        return true;
      } else if (value < fragments[mid]) {
        end = mid - 1;
      } else {
        start = mid + 1;
      }
    }
    return false;
  }
  static getInteger(chars) {
    if (chars.length > 6) {
      return 0;
    }
    let value = 0;
    for (let index = 0;index < chars.length; index++) {
      const char = chars[chars.length - index - 1];
      if (this.isLowercaseAlpha(char)) {
        value = value * 38 + char.charCodeAt(0) + 1 - 97;
      } else if (char === "'") {
        value = value * 38 + 27;
      } else if (this.isNumerical(char)) {
        value = value * 38 + char.charCodeAt(0) + 28 - 48;
      } else if (char !== "\x00") {
        return 0;
      }
    }
    return value;
  }
  static indexOfNumber(chars, offset) {
    for (let index = offset;index < chars.length && index >= 0; index++) {
      if (this.isNumerical(chars[index])) {
        return index;
      }
    }
    return -1;
  }
  static indexOfNonNumber(offset, chars) {
    for (let index = offset;index < chars.length && index >= 0; index++) {
      if (!this.isNumerical(chars[index])) {
        return index;
      }
    }
    return chars.length;
  }
  static getEmulatedDomainCharLen(nextChar, domainChar, currentChar) {
    if (domainChar === currentChar) {
      return 1;
    } else if (domainChar === "o" && currentChar === "0") {
      return 1;
    } else if (domainChar === "o" && currentChar === "(" && nextChar === ")") {
      return 2;
    } else if (domainChar === "c" && (currentChar === "(" || currentChar === "<" || currentChar === "[")) {
      return 1;
    } else if (domainChar === "e" && currentChar === "€") {
      return 1;
    } else if (domainChar === "s" && currentChar === "$") {
      return 1;
    } else if (domainChar === "l" && currentChar === "i") {
      return 1;
    }
    return 0;
  }
  static filterDomain(period, ampersat, domain, chars) {
    const domainLength = domain.length;
    const charsLength = chars.length;
    for (let index = 0;index <= charsLength - domainLength; index++) {
      const { matched, currentIndex } = this.findMatchingDomain(index, domain, chars);
      if (!matched) {
        continue;
      }
      const ampersatStatus = this.prefixSymbolStatus(index, chars, 3, ampersat, ["@"]);
      const periodStatus = this.suffixSymbolStatus(currentIndex - 1, chars, 3, period, [".", ","]);
      const shouldFilter = ampersatStatus > 2 || periodStatus > 2;
      if (!shouldFilter) {
        continue;
      }
      this.maskChars(index, currentIndex, chars);
    }
  }
  static findMatchingDomain(startIndex, domain, chars) {
    const domainLength = domain.length;
    let currentIndex = startIndex;
    let domainIndex = 0;
    while (currentIndex < chars.length && domainIndex < domainLength) {
      const currentChar = chars[currentIndex];
      const nextChar = currentIndex + 1 < chars.length ? chars[currentIndex + 1] : "\x00";
      const currentLength = this.getEmulatedDomainCharLen(nextChar, String.fromCharCode(domain[domainIndex]), currentChar);
      if (currentLength > 0) {
        currentIndex += currentLength;
        domainIndex++;
      } else {
        if (domainIndex === 0)
          break;
        const previousLength = this.getEmulatedDomainCharLen(nextChar, String.fromCharCode(domain[domainIndex - 1]), currentChar);
        if (previousLength > 0) {
          currentIndex += previousLength;
          if (domainIndex === 1)
            startIndex++;
        } else {
          if (domainIndex >= domainLength || !this.isSymbol(currentChar))
            break;
          currentIndex++;
        }
      }
    }
    return { matched: domainIndex >= domainLength, currentIndex };
  }
  static filterBadCombinations(combos, chars, bads) {
    if (bads.length > chars.length) {
      return;
    }
    for (let startIndex = 0;startIndex <= chars.length - bads.length; startIndex++) {
      let currentIndex = startIndex;
      const { currentIndex: updatedCurrentIndex, badIndex, hasSymbol, hasNumber, hasDigit } = this.processBadCharacters(chars, bads, currentIndex);
      currentIndex = updatedCurrentIndex;
      let currentChar = chars[currentIndex];
      let nextChar = currentIndex + 1 < chars.length ? chars[currentIndex + 1] : "\x00";
      if (!(badIndex >= bads.length && (!hasNumber || !hasDigit))) {
        continue;
      }
      let shouldFilter = true;
      let localIndex;
      if (hasSymbol) {
        let isBeforeSymbol = false;
        let isAfterSymbol = false;
        if (startIndex - 1 < 0 || this.isSymbol(chars[startIndex - 1]) && chars[startIndex - 1] !== "'") {
          isBeforeSymbol = true;
        }
        if (currentIndex >= chars.length || this.isSymbol(chars[currentIndex]) && chars[currentIndex] !== "'") {
          isAfterSymbol = true;
        }
        if (!isBeforeSymbol || !isAfterSymbol) {
          let isSubstringValid = false;
          localIndex = startIndex - 2;
          if (isBeforeSymbol) {
            localIndex = startIndex;
          }
          while (!isSubstringValid && localIndex < currentIndex) {
            if (localIndex >= 0 && (!this.isSymbol(chars[localIndex]) || chars[localIndex] === "'")) {
              const localSubString = [];
              let localSubStringIndex;
              for (localSubStringIndex = 0;localSubStringIndex < 3 && localIndex + localSubStringIndex < chars.length && (!this.isSymbol(chars[localIndex + localSubStringIndex]) || chars[localIndex + localSubStringIndex] === "'"); localSubStringIndex++) {
                localSubString[localSubStringIndex] = chars[localIndex + localSubStringIndex];
              }
              let isSubStringValidCondition = true;
              if (localSubStringIndex === 0) {
                isSubStringValidCondition = false;
              }
              if (localSubStringIndex < 3 && localIndex - 1 >= 0 && (!this.isSymbol(chars[localIndex - 1]) || chars[localIndex - 1] === "'")) {
                isSubStringValidCondition = false;
              }
              if (isSubStringValidCondition && !this.isBadFragment(localSubString)) {
                isSubstringValid = true;
              }
            }
            localIndex++;
          }
          if (!isSubstringValid) {
            shouldFilter = false;
          }
        }
      } else {
        currentChar = " ";
        if (startIndex - 1 >= 0) {
          currentChar = chars[startIndex - 1];
        }
        nextChar = " ";
        if (currentIndex < chars.length) {
          nextChar = chars[currentIndex];
        }
        const current = this.getIndex(currentChar);
        const next2 = this.getIndex(nextChar);
        if (combos && this.comboMatches(current, combos, next2)) {
          shouldFilter = false;
        }
      }
      if (!shouldFilter) {
        continue;
      }
      let numeralCount = 0;
      let alphaCount = 0;
      for (let index = startIndex;index < currentIndex; index++) {
        if (this.isNumerical(chars[index])) {
          numeralCount++;
        } else if (this.isAlpha(chars[index])) {
          alphaCount++;
        }
      }
      if (numeralCount <= alphaCount) {
        this.maskChars(startIndex, currentIndex, chars);
      }
    }
  }
  static processBadCharacters(chars, bads, startIndex) {
    let index = startIndex;
    let badIndex = 0;
    let count = 0;
    let hasSymbol = false;
    let hasNumber = false;
    let hasDigit = false;
    for (;index < chars.length && !(hasNumber && hasDigit); ) {
      if (index >= chars.length || hasNumber && hasDigit) {
        break;
      }
      const currentChar = chars[index];
      const nextChar = index + 1 < chars.length ? chars[index + 1] : "\x00";
      let currentLength;
      if (badIndex < bads.length && (currentLength = this.getEmulatedBadCharLen(nextChar, String.fromCharCode(bads[badIndex]), currentChar)) > 0) {
        if (currentLength === 1 && this.isNumerical(currentChar)) {
          hasNumber = true;
        }
        if (currentLength === 2 && (this.isNumerical(currentChar) || this.isNumerical(nextChar))) {
          hasNumber = true;
        }
        index += currentLength;
        badIndex++;
      } else {
        if (badIndex === 0) {
          break;
        }
        let previousLength;
        if ((previousLength = this.getEmulatedBadCharLen(nextChar, String.fromCharCode(bads[badIndex - 1]), currentChar)) > 0) {
          index += previousLength;
        } else {
          if (badIndex >= bads.length || !this.isNotLowercaseAlpha(currentChar)) {
            break;
          }
          if (this.isSymbol(currentChar) && currentChar !== "'") {
            hasSymbol = true;
          }
          if (this.isNumerical(currentChar)) {
            hasDigit = true;
          }
          index++;
          count++;
          if ((count * 100 / (index - startIndex) | 0) > 90) {
            break;
          }
        }
      }
    }
    return { currentIndex: index, badIndex, hasSymbol, hasNumber, hasDigit };
  }
  static getEmulatedBadCharLen(nextChar, badChar, currentChar) {
    if (badChar === currentChar) {
      return 1;
    }
    if (badChar >= "a" && badChar <= "m") {
      if (badChar === "a") {
        if (currentChar !== "4" && currentChar !== "@" && currentChar !== "^") {
          if (currentChar === "/" && nextChar === "\\") {
            return 2;
          }
          return 0;
        }
        return 1;
      }
      if (badChar === "b") {
        if (currentChar !== "6" && currentChar !== "8") {
          if (currentChar === "1" && nextChar === "3") {
            return 2;
          }
          return 0;
        }
        return 1;
      }
      if (badChar === "c") {
        if (currentChar !== "(" && currentChar !== "<" && currentChar !== "{" && currentChar !== "[") {
          return 0;
        }
        return 1;
      }
      if (badChar === "d") {
        if (currentChar === "[" && nextChar === ")") {
          return 2;
        }
        return 0;
      }
      if (badChar === "e") {
        if (currentChar !== "3" && currentChar !== "€") {
          return 0;
        }
        return 1;
      }
      if (badChar === "f") {
        if (currentChar === "p" && nextChar === "h") {
          return 2;
        }
        if (currentChar === "£") {
          return 1;
        }
        return 0;
      }
      if (badChar === "g") {
        if (currentChar !== "9" && currentChar !== "6") {
          return 0;
        }
        return 1;
      }
      if (badChar === "h") {
        if (currentChar === "#") {
          return 1;
        }
        return 0;
      }
      if (badChar === "i") {
        if (currentChar !== "y" && currentChar !== "l" && currentChar !== "j" && currentChar !== "1" && currentChar !== "!" && currentChar !== ":" && currentChar !== ";" && currentChar !== "|") {
          return 0;
        }
        return 1;
      }
      if (badChar === "j") {
        return 0;
      }
      if (badChar === "k") {
        return 0;
      }
      if (badChar === "l") {
        if (currentChar !== "1" && currentChar !== "|" && currentChar !== "i") {
          return 0;
        }
        return 1;
      }
      if (badChar === "m") {
        return 0;
      }
    }
    if (badChar >= "n" && badChar <= "z") {
      if (badChar === "n") {
        return 0;
      }
      if (badChar === "o") {
        if (currentChar !== "0" && currentChar !== "*") {
          if ((currentChar !== "(" || nextChar !== ")") && (currentChar !== "[" || nextChar !== "]") && (currentChar !== "{" || nextChar !== "}") && (currentChar !== "<" || nextChar !== ">")) {
            return 0;
          }
          return 2;
        }
        return 1;
      }
      if (badChar === "p") {
        return 0;
      }
      if (badChar === "q") {
        return 0;
      }
      if (badChar === "r") {
        return 0;
      }
      if (badChar === "s") {
        if (currentChar !== "5" && currentChar !== "z" && currentChar !== "$" && currentChar !== "2") {
          return 0;
        }
        return 1;
      }
      if (badChar === "t") {
        if (currentChar !== "7" && currentChar !== "+") {
          return 0;
        }
        return 1;
      }
      if (badChar === "u") {
        if (currentChar === "v") {
          return 1;
        }
        if ((currentChar !== "\\" || nextChar !== "/") && (currentChar !== "\\" || nextChar !== "|") && (currentChar !== "|" || nextChar !== "/")) {
          return 0;
        }
        return 2;
      }
      if (badChar === "v") {
        if ((currentChar !== "\\" || nextChar !== "/") && (currentChar !== "\\" || nextChar !== "|") && (currentChar !== "|" || nextChar !== "/")) {
          return 0;
        }
        return 2;
      }
      if (badChar === "w") {
        if (currentChar === "v" && nextChar === "v") {
          return 2;
        }
        return 0;
      }
      if (badChar === "x") {
        if ((currentChar !== ")" || nextChar !== "(") && (currentChar !== "}" || nextChar !== "{") && (currentChar !== "]" || nextChar !== "[") && (currentChar !== ">" || nextChar !== "<")) {
          return 0;
        }
        return 2;
      }
      if (badChar === "y") {
        return 0;
      }
      if (badChar === "z") {
        return 0;
      }
    }
    if (badChar >= "0" && badChar <= "9") {
      if (badChar === "0") {
        if (currentChar === "o" || currentChar === "O") {
          return 1;
        } else if ((currentChar !== "(" || nextChar !== ")") && (currentChar !== "{" || nextChar !== "}") && (currentChar !== "[" || nextChar !== "]")) {
          return 0;
        } else {
          return 2;
        }
      } else if (badChar === "1") {
        return currentChar === "l" ? 1 : 0;
      } else {
        return 0;
      }
    } else if (badChar === ",") {
      return currentChar === "." ? 1 : 0;
    } else if (badChar === ".") {
      return currentChar === "," ? 1 : 0;
    } else if (badChar === "!") {
      return currentChar === "i" ? 1 : 0;
    }
    return 0;
  }
  static comboMatches(currentIndex, combos, nextIndex) {
    let start = 0;
    let end = combos.length - 1;
    while (start <= end) {
      const mid = (start + end) / 2 | 0;
      if (combos[mid][0] === currentIndex && combos[mid][1] === nextIndex) {
        return true;
      } else if (currentIndex < combos[mid][0] || currentIndex === combos[mid][0] && nextIndex < combos[mid][1]) {
        end = mid - 1;
      } else {
        start = mid + 1;
      }
    }
    return false;
  }
  static getIndex(char) {
    if (this.isLowercaseAlpha(char)) {
      return char.charCodeAt(0) + 1 - 97;
    } else if (char === "'") {
      return 28;
    } else if (this.isNumerical(char)) {
      return char.charCodeAt(0) + 29 - 48;
    }
    return 27;
  }
  static filterTld(slash, tldType, chars, tld, period) {
    if (tld.length > chars.length) {
      return;
    }
    for (let index = 0;index <= chars.length - tld.length; index++) {
      const { currentIndex, tldIndex } = this.processTlds(chars, tld, index);
      if (tldIndex < tld.length) {
        continue;
      }
      let shouldFilter = false;
      const periodFilterStatus = this.prefixSymbolStatus(index, chars, 3, period, [",", "."]);
      const slashFilterStatus = this.suffixSymbolStatus(currentIndex - 1, chars, 5, slash, ["\\", "/"]);
      if (tldType === 1 && periodFilterStatus > 0 && slashFilterStatus > 0) {
        shouldFilter = true;
      }
      if (tldType === 2 && (periodFilterStatus > 2 && slashFilterStatus > 0 || periodFilterStatus > 0 && slashFilterStatus > 2)) {
        shouldFilter = true;
      }
      if (tldType === 3 && periodFilterStatus > 0 && slashFilterStatus > 2) {
        shouldFilter = true;
      }
      if (!shouldFilter) {
        continue;
      }
      let startFilterIndex = index;
      let endFilterIndex = currentIndex - 1;
      let foundPeriod = false;
      let periodIndex;
      if (periodFilterStatus > 2) {
        if (periodFilterStatus === 4) {
          foundPeriod = false;
          for (periodIndex = index - 1;periodIndex >= 0; periodIndex--) {
            if (foundPeriod) {
              if (period[periodIndex] !== "*") {
                break;
              }
              startFilterIndex = periodIndex;
            } else if (period[periodIndex] === "*") {
              startFilterIndex = periodIndex;
              foundPeriod = true;
            }
          }
        }
        foundPeriod = false;
        for (periodIndex = startFilterIndex - 1;periodIndex >= 0; periodIndex--) {
          if (foundPeriod) {
            if (this.isSymbol(chars[periodIndex])) {
              break;
            }
            startFilterIndex = periodIndex;
          } else if (!this.isSymbol(chars[periodIndex])) {
            foundPeriod = true;
            startFilterIndex = periodIndex;
          }
        }
      }
      if (slashFilterStatus > 2) {
        if (slashFilterStatus === 4) {
          foundPeriod = false;
          for (periodIndex = endFilterIndex + 1;periodIndex < chars.length; periodIndex++) {
            if (foundPeriod) {
              if (slash[periodIndex] !== "*") {
                break;
              }
              endFilterIndex = periodIndex;
            } else if (slash[periodIndex] === "*") {
              endFilterIndex = periodIndex;
              foundPeriod = true;
            }
          }
        }
        foundPeriod = false;
        for (periodIndex = endFilterIndex + 1;periodIndex < chars.length; periodIndex++) {
          if (foundPeriod) {
            if (this.isSymbol(chars[periodIndex])) {
              break;
            }
            endFilterIndex = periodIndex;
          } else if (!this.isSymbol(chars[periodIndex])) {
            foundPeriod = true;
            endFilterIndex = periodIndex;
          }
        }
      }
      this.maskChars(startFilterIndex, endFilterIndex + 1, chars);
    }
  }
  static processTlds(chars, tld, currentIndex) {
    let tldIndex = 0;
    while (currentIndex < chars.length && tldIndex < tld.length) {
      const currentChar = chars[currentIndex];
      const nextChar = currentIndex + 1 < chars.length ? chars[currentIndex + 1] : "\x00";
      let currentLength;
      if ((currentLength = this.getEmulatedDomainCharLen(nextChar, String.fromCharCode(tld[tldIndex]), currentChar)) > 0) {
        currentIndex += currentLength;
        tldIndex++;
      } else {
        if (tldIndex === 0) {
          break;
        }
        let previousLength;
        if ((previousLength = this.getEmulatedDomainCharLen(nextChar, String.fromCharCode(tld[tldIndex - 1]), currentChar)) > 0) {
          currentIndex += previousLength;
        } else {
          if (!this.isSymbol(currentChar)) {
            break;
          }
          currentIndex++;
        }
      }
    }
    return { currentIndex, tldIndex };
  }
  static isSymbol(char) {
    return !this.isAlpha(char) && !this.isNumerical(char);
  }
  static isNotLowercaseAlpha(char) {
    return this.isLowercaseAlpha(char) ? char === "v" || char === "x" || char === "j" || char === "q" || char === "z" : true;
  }
  static isAlpha(char) {
    return this.isLowercaseAlpha(char) || this.isUppercaseAlpha(char);
  }
  static isNumerical(char) {
    return char >= "0" && char <= "9";
  }
  static isLowercaseAlpha(char) {
    return char >= "a" && char <= "z";
  }
  static isUppercaseAlpha(char) {
    return char >= "A" && char <= "Z";
  }
  static isNumericalChars(chars) {
    for (let index = 0;index < chars.length; index++) {
      if (!this.isNumerical(chars[index]) && chars[index] !== "\x00") {
        return false;
      }
    }
    return true;
  }
  static maskChars(offset, length, chars) {
    for (let index = offset;index < length; index++) {
      chars[index] = "*";
    }
  }
  static maskedCountBackwards(chars, offset) {
    let count = 0;
    for (let index = offset - 1;index >= 0 && this.isSymbol(chars[index]); index--) {
      if (chars[index] === "*") {
        count++;
      }
    }
    return count;
  }
  static maskedCountForwards(chars, offset) {
    let count = 0;
    for (let index = offset + 1;index < chars.length && this.isSymbol(chars[index]); index++) {
      if (chars[index] === "*") {
        count++;
      }
    }
    return count;
  }
  static maskedCharsStatus(chars, filtered, offset, length, prefix) {
    const count = prefix ? this.maskedCountBackwards(filtered, offset) : this.maskedCountForwards(filtered, offset);
    if (count >= length) {
      return 4;
    } else if (this.isSymbol(prefix ? chars[offset - 1] : chars[offset + 1])) {
      return 1;
    }
    return 0;
  }
  static prefixSymbolStatus(offset, chars, length, symbolChars, symbols) {
    if (offset === 0) {
      return 2;
    }
    for (let index = offset - 1;index >= 0 && this.isSymbol(chars[index]); index--) {
      if (symbols.includes(chars[index])) {
        return 3;
      }
    }
    return this.maskedCharsStatus(chars, symbolChars, offset, length, true);
  }
  static suffixSymbolStatus(offset, chars, length, symbolChars, symbols) {
    if (offset + 1 === chars.length) {
      return 2;
    }
    for (let index = offset + 1;index < chars.length && this.isSymbol(chars[index]); index++) {
      if (symbols.includes(chars[index])) {
        return 3;
      }
    }
    return this.maskedCharsStatus(chars, symbolChars, offset, length, false);
  }
  static format(chars) {
    let pos = 0;
    for (let index = 0;index < chars.length; index++) {
      if (this.isCharacterAllowed(chars[index])) {
        chars[pos] = chars[index];
      } else {
        chars[pos] = " ";
      }
      if (pos === 0 || chars[pos] !== " " || chars[pos - 1] !== " ") {
        pos++;
      }
    }
    for (let index = pos;index < chars.length; index++) {
      chars[index] = " ";
    }
  }
  static isCharacterAllowed(char) {
    return char >= " " && char <= "" || char === " " || char === `
` || char === "\t" || char === "£" || char === "€";
  }
  static replaceUppercases(chars, comparison) {
    for (let index = 0;index < comparison.length; index++) {
      if (chars[index] !== "*" && this.isUppercaseAlpha(comparison[index])) {
        chars[index] = comparison[index];
      }
    }
  }
  static formatUppercases(chars) {
    let flagged = true;
    for (let index = 0;index < chars.length; index++) {
      const char = chars[index];
      if (!this.isAlpha(char)) {
        flagged = true;
      } else if (flagged) {
        if (this.isLowercaseAlpha(char)) {
          flagged = false;
        }
      } else if (this.isUppercaseAlpha(char)) {
        chars[index] = String.fromCharCode(char.charCodeAt(0) + 97 - 65);
      }
    }
  }
}

// src/wordfilter/WordPack.ts
class WordPack {
  static TABLE = [
    " ",
    "e",
    "t",
    "a",
    "o",
    "i",
    "h",
    "n",
    "s",
    "r",
    "d",
    "l",
    "u",
    "m",
    "w",
    "c",
    "y",
    "f",
    "g",
    "p",
    "b",
    "v",
    "k",
    "x",
    "j",
    "q",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    " ",
    "!",
    "?",
    ".",
    ",",
    ":",
    ";",
    "(",
    ")",
    "-",
    "&",
    "*",
    "\\",
    "'",
    "@",
    "#",
    "+",
    "=",
    "£",
    "$",
    "%",
    '"',
    "[",
    "]"
  ];
  static charBuffer = [];
  static unpack(word, length) {
    let pos = 0;
    let carry = -1;
    let nibble;
    for (let index = 0;index < length && pos < 100; index++) {
      const value = word.g1();
      nibble = value >> 4 & 15;
      if (carry !== -1) {
        this.charBuffer[pos++] = this.TABLE[(carry << 4) + nibble - 195];
        carry = -1;
      } else if (nibble < 13) {
        this.charBuffer[pos++] = this.TABLE[nibble];
      } else {
        carry = nibble;
      }
      nibble = value & 15;
      if (carry !== -1) {
        this.charBuffer[pos++] = this.TABLE[(carry << 4) + nibble - 195];
        carry = -1;
      } else if (nibble < 13) {
        this.charBuffer[pos++] = this.TABLE[nibble];
      } else {
        carry = nibble;
      }
    }
    let uppercase = true;
    for (let index = 0;index < pos; index++) {
      const char = this.charBuffer[index];
      if (uppercase && char >= "a" && char <= "z") {
        this.charBuffer[index] = char.toUpperCase();
        uppercase = false;
      }
      if (char === "." || char === "!") {
        uppercase = true;
      }
    }
    return this.charBuffer.slice(0, pos).join("");
  }
  static pack(word, str) {
    if (str.length > 80) {
      str = str.substring(0, 80);
    }
    str = str.toLowerCase();
    let carry = -1;
    for (let index = 0;index < str.length; index++) {
      const char = str.charAt(index);
      let currentChar = 0;
      for (let lookupIndex = 0;lookupIndex < this.TABLE.length; lookupIndex++) {
        if (char === this.TABLE[lookupIndex]) {
          currentChar = lookupIndex;
          break;
        }
      }
      if (currentChar > 12) {
        currentChar += 195;
      }
      if (carry === -1) {
        if (currentChar < 13) {
          carry = currentChar;
        } else {
          word.p1(currentChar);
        }
      } else if (currentChar < 13) {
        word.p1((carry << 4) + currentChar);
        carry = -1;
      } else {
        word.p1((carry << 4) + (currentChar >> 4));
        carry = currentChar & 15;
      }
    }
    if (carry !== -1) {
      word.p1(carry << 4);
    }
  }
}

// src/sound/Envelope.ts
class Envelope {
  length = 0;
  shapeDelta = null;
  shapePeak = null;
  start = 0;
  end = 0;
  form = 0;
  threshold = 0;
  position = 0;
  delta = 0;
  amplitude = 0;
  ticks = 0;
  load(dat) {
    this.form = dat.g1();
    this.start = dat.g4();
    this.end = dat.g4();
    this.length = dat.g1();
    this.shapeDelta = new Int32Array(this.length);
    this.shapePeak = new Int32Array(this.length);
    for (let i = 0;i < this.length; i++) {
      this.shapeDelta[i] = dat.g2();
      this.shapePeak[i] = dat.g2();
    }
  }
  genInit() {
    this.threshold = 0;
    this.position = 0;
    this.delta = 0;
    this.amplitude = 0;
    this.ticks = 0;
  }
  genNext(delta) {
    if (this.ticks >= this.threshold && this.shapePeak && this.shapeDelta) {
      this.amplitude = this.shapePeak[this.position++] << 15;
      if (this.position >= this.length) {
        this.position = this.length - 1;
      }
      this.threshold = this.shapeDelta[this.position] / 65536 * delta | 0;
      if (this.threshold > this.ticks) {
        this.delta = ((this.shapePeak[this.position] << 15) - this.amplitude) / (this.threshold - this.ticks) | 0;
      }
    }
    this.amplitude += this.delta;
    this.ticks++;
    return this.amplitude - this.delta >> 15;
  }
}

// src/sound/Tone.ts
class Tone {
  static buf = null;
  static noise = null;
  static sine = null;
  static fPos = new Int32Array(5);
  static fDel = new Int32Array(5);
  static fAmp = new Int32Array(5);
  static fMulti = new Int32Array(5);
  static fOffset = new Int32Array(5);
  static init() {
    this.noise = new Int32Array(32768);
    for (let i = 0;i < 32768; i++) {
      if (Math.random() > 0.5) {
        this.noise[i] = 1;
      } else {
        this.noise[i] = -1;
      }
    }
    this.sine = new Int32Array(32768);
    for (let i = 0;i < 32768; i++) {
      this.sine[i] = Math.sin(i / 5215.1903) * 16384 | 0;
    }
    this.buf = new Int32Array(22050 * 10);
  }
  frequencyBase = null;
  amplitudeBase = null;
  frequencyModRate = null;
  frequencyModRange = null;
  amplitudeModRate = null;
  amplitudeModRange = null;
  release = null;
  attack = null;
  harmonicVolume = new Int32Array(5);
  harmonicSemitone = new Int32Array(5);
  harmonicDelay = new Int32Array(5);
  reverbDelay = 0;
  reverbVolume = 100;
  length = 500;
  start = 0;
  generate(sampleCount, length) {
    if (!this.frequencyBase || !this.amplitudeBase) {
      return Tone.buf;
    }
    for (let sample = 0;sample < sampleCount; sample++) {
      Tone.buf[sample] = 0;
    }
    if (length < 10) {
      return Tone.buf;
    }
    const samplesPerStep = sampleCount / length | 0;
    this.frequencyBase.genInit();
    this.amplitudeBase.genInit();
    let frequencyStart = 0;
    let frequencyDuration = 0;
    let frequencyPhase = 0;
    if (this.frequencyModRate && this.frequencyModRange) {
      this.frequencyModRate.genInit();
      this.frequencyModRange.genInit();
      frequencyStart = (this.frequencyModRate.end - this.frequencyModRate.start) * 32.768 / samplesPerStep | 0;
      frequencyDuration = this.frequencyModRate.start * 32.768 / samplesPerStep | 0;
    }
    let amplitudeStart = 0;
    let amplitudeDuration = 0;
    let amplitudePhase = 0;
    if (this.amplitudeModRate && this.amplitudeModRange) {
      this.amplitudeModRate.genInit();
      this.amplitudeModRange.genInit();
      amplitudeStart = (this.amplitudeModRate.end - this.amplitudeModRate.start) * 32.768 / samplesPerStep | 0;
      amplitudeDuration = this.amplitudeModRate.start * 32.768 / samplesPerStep | 0;
    }
    for (let harmonic = 0;harmonic < 5; harmonic++) {
      if (this.frequencyBase && this.harmonicVolume[harmonic] !== 0) {
        Tone.fPos[harmonic] = 0;
        Tone.fDel[harmonic] = this.harmonicDelay[harmonic] * samplesPerStep;
        Tone.fAmp[harmonic] = (this.harmonicVolume[harmonic] << 14) / 100 | 0;
        Tone.fMulti[harmonic] = (this.frequencyBase.end - this.frequencyBase.start) * 32.768 * Math.pow(1.0057929410678534, this.harmonicSemitone[harmonic]) / samplesPerStep | 0;
        Tone.fOffset[harmonic] = this.frequencyBase.start * 32.768 / samplesPerStep | 0;
      }
    }
    for (let sample = 0;sample < sampleCount; sample++) {
      let frequency = this.frequencyBase.genNext(sampleCount);
      let amplitude = this.amplitudeBase.genNext(sampleCount);
      if (this.frequencyModRate && this.frequencyModRange) {
        const rate = this.frequencyModRate.genNext(sampleCount);
        const range = this.frequencyModRange.genNext(sampleCount);
        frequency += this.waveFunc(range, frequencyPhase, this.frequencyModRate.form) >> 1;
        frequencyPhase += (rate * frequencyStart >> 16) + frequencyDuration;
      }
      if (this.amplitudeModRate && this.amplitudeModRange) {
        const rate = this.amplitudeModRate.genNext(sampleCount);
        const range = this.amplitudeModRange.genNext(sampleCount);
        amplitude = amplitude * ((this.waveFunc(range, amplitudePhase, this.amplitudeModRate.form) >> 1) + 32768) >> 15;
        amplitudePhase += (rate * amplitudeStart >> 16) + amplitudeDuration;
      }
      for (let harmonic = 0;harmonic < 5; harmonic++) {
        if (this.harmonicVolume[harmonic] !== 0) {
          const position = sample + Tone.fDel[harmonic];
          if (position < sampleCount) {
            Tone.buf[position] += this.waveFunc(amplitude * Tone.fAmp[harmonic] >> 15, Tone.fPos[harmonic], this.frequencyBase.form);
            Tone.fPos[harmonic] += (frequency * Tone.fMulti[harmonic] >> 16) + Tone.fOffset[harmonic];
          }
        }
      }
    }
    if (this.release && this.attack) {
      this.release.genInit();
      this.attack.genInit();
      let counter = 0;
      let muted = true;
      for (let sample = 0;sample < sampleCount; sample++) {
        const releaseValue = this.release.genNext(sampleCount);
        const attackValue = this.attack.genNext(sampleCount);
        let threshold;
        if (muted) {
          threshold = this.release.start + ((this.release.end - this.release.start) * releaseValue >> 8);
        } else {
          threshold = this.release.start + ((this.release.end - this.release.start) * attackValue >> 8);
        }
        counter += 256;
        if (counter >= threshold) {
          counter = 0;
          muted = !muted;
        }
        if (muted) {
          Tone.buf[sample] = 0;
        }
      }
    }
    if (this.reverbDelay > 0 && this.reverbVolume > 0) {
      const start = this.reverbDelay * samplesPerStep;
      for (let sample = start;sample < sampleCount; sample++) {
        Tone.buf[sample] += Tone.buf[sample - start] * this.reverbVolume / 100 | 0;
        Tone.buf[sample] |= 0;
      }
    }
    for (let sample = 0;sample < sampleCount; sample++) {
      if (Tone.buf[sample] < -32768) {
        Tone.buf[sample] = -32768;
      }
      if (Tone.buf[sample] > 32767) {
        Tone.buf[sample] = 32767;
      }
    }
    return Tone.buf;
  }
  waveFunc(amplitude, phase, form) {
    if (form === 1) {
      return (phase & 32767) < 16384 ? amplitude : -amplitude;
    } else if (form === 2) {
      return Tone.sine[phase & 32767] * amplitude >> 14;
    } else if (form === 3) {
      return ((phase & 32767) * amplitude >> 14) - amplitude;
    } else if (form === 4) {
      return Tone.noise[(phase / 2607 | 0) & 32767] * amplitude;
    } else {
      return 0;
    }
  }
  load(dat) {
    this.frequencyBase = new Envelope;
    this.frequencyBase.load(dat);
    this.amplitudeBase = new Envelope;
    this.amplitudeBase.load(dat);
    if (dat.g1() !== 0) {
      dat.pos--;
      this.frequencyModRate = new Envelope;
      this.frequencyModRate.load(dat);
      this.frequencyModRange = new Envelope;
      this.frequencyModRange.load(dat);
    }
    if (dat.g1() !== 0) {
      dat.pos--;
      this.amplitudeModRate = new Envelope;
      this.amplitudeModRate.load(dat);
      this.amplitudeModRange = new Envelope;
      this.amplitudeModRange.load(dat);
    }
    if (dat.g1() !== 0) {
      dat.pos--;
      this.release = new Envelope;
      this.release.load(dat);
      this.attack = new Envelope;
      this.attack.load(dat);
    }
    for (let harmonic = 0;harmonic < 10; harmonic++) {
      const volume = dat.gsmart();
      if (volume === 0) {
        break;
      }
      this.harmonicVolume[harmonic] = volume;
      this.harmonicSemitone[harmonic] = dat.gsmarts();
      this.harmonicDelay[harmonic] = dat.gsmart();
    }
    this.reverbDelay = dat.gsmart();
    this.reverbVolume = dat.gsmart();
    this.length = dat.g2();
    this.start = dat.g2();
  }
}

// src/sound/JagFX.ts
class JagFX {
  static synth = new TypedArray1d(1000, null);
  static delays = new Int32Array(1000);
  static waveBytes = null;
  static waveBuffer = null;
  tones = new TypedArray1d(10, null);
  loopBegin = 0;
  loopEnd = 0;
  static init(buf) {
    this.waveBytes = new Uint8Array(44100 * 10);
    this.waveBuffer = new Packet(this.waveBytes);
    Tone.init();
    while (true) {
      const id = buf.g2();
      if (id === 65535) {
        break;
      }
      this.synth[id] = new JagFX;
      this.synth[id].load(buf);
      this.delays[id] = this.synth[id].optimiseStart();
    }
  }
  static generate(id, loopCount) {
    if (!this.synth[id]) {
      return null;
    }
    const track = this.synth[id];
    return track?.getWave(loopCount) ?? null;
  }
  load(dat) {
    for (let tone = 0;tone < 10; tone++) {
      if (dat.g1() !== 0) {
        dat.pos--;
        this.tones[tone] = new Tone;
        this.tones[tone]?.load(dat);
      }
    }
    this.loopBegin = dat.g2();
    this.loopEnd = dat.g2();
  }
  optimiseStart() {
    let start = 9999999;
    for (let tone = 0;tone < 10; tone++) {
      if (this.tones[tone] && (this.tones[tone].start / 20 | 0) < start) {
        start = this.tones[tone].start / 20 | 0;
      }
    }
    if (this.loopBegin < this.loopEnd && (this.loopBegin / 20 | 0) < start) {
      start = this.loopBegin / 20 | 0;
    }
    if (start === 9999999 || start === 0) {
      return 0;
    }
    for (let tone = 0;tone < 10; tone++) {
      if (this.tones[tone]) {
        this.tones[tone].start -= start * 20;
      }
    }
    if (this.loopBegin < this.loopEnd) {
      this.loopBegin -= start * 20;
      this.loopEnd -= start * 20;
    }
    return start;
  }
  getWave(loopCount) {
    if (!JagFX.waveBuffer) {
      return null;
    }
    const length = this.makeSound(loopCount);
    JagFX.waveBuffer.pos = 0;
    JagFX.waveBuffer.p4(1380533830);
    JagFX.waveBuffer.ip4(length + 36);
    JagFX.waveBuffer.p4(1463899717);
    JagFX.waveBuffer.p4(1718449184);
    JagFX.waveBuffer.ip4(16);
    JagFX.waveBuffer.ip2(1);
    JagFX.waveBuffer.ip2(1);
    JagFX.waveBuffer.ip4(22050);
    JagFX.waveBuffer.ip4(22050);
    JagFX.waveBuffer.ip2(1);
    JagFX.waveBuffer.ip2(8);
    JagFX.waveBuffer.p4(1684108385);
    JagFX.waveBuffer.ip4(length);
    JagFX.waveBuffer.pos += length;
    return JagFX.waveBuffer;
  }
  makeSound(loopCount) {
    let duration = 0;
    for (let tone = 0;tone < 10; tone++) {
      if (this.tones[tone] && this.tones[tone].length + this.tones[tone].start > duration) {
        duration = this.tones[tone].length + this.tones[tone].start;
      }
    }
    if (duration === 0) {
      return 0;
    }
    let sampleCount = duration * 22050 / 1000 | 0;
    let loopStart = this.loopBegin * 22050 / 1000 | 0;
    let loopStop = this.loopEnd * 22050 / 1000 | 0;
    if (loopStart < 0 || loopStop < 0 || loopStop > sampleCount || loopStart >= loopStop) {
      loopCount = 0;
    }
    let totalSampleCount = sampleCount + (loopStop - loopStart) * (loopCount - 1);
    for (let sample = 44;sample < totalSampleCount + 44; sample++) {
      if (JagFX.waveBytes) {
        JagFX.waveBytes[sample] = -128;
      }
    }
    for (let tone = 0;tone < 10; tone++) {
      if (this.tones[tone]) {
        const toneSampleCount = this.tones[tone].length * 22050 / 1000 | 0;
        const start = this.tones[tone].start * 22050 / 1000 | 0;
        const samples = this.tones[tone].generate(toneSampleCount, this.tones[tone].length);
        for (let sample = 0;sample < toneSampleCount; sample++) {
          if (JagFX.waveBytes) {
            JagFX.waveBytes[sample + start + 44] += samples[sample] >> 8 << 24 >> 24;
          }
        }
      }
    }
    if (loopCount > 1) {
      loopStart += 44;
      loopStop += 44;
      sampleCount += 44;
      totalSampleCount += 44;
      const endOffset = totalSampleCount - sampleCount;
      for (let sample = sampleCount - 1;sample >= loopStop; sample--) {
        if (JagFX.waveBytes) {
          JagFX.waveBytes[sample + endOffset] = JagFX.waveBytes[sample];
        }
      }
      for (let loop = 1;loop < loopCount; loop++) {
        const offset = (loopStop - loopStart) * loop;
        for (let sample = loopStart;sample < loopStop; sample++) {
          if (JagFX.waveBytes) {
            JagFX.waveBytes[sample + offset] = JagFX.waveBytes[sample];
          }
        }
      }
      totalSampleCount -= 44;
    }
    return totalSampleCount;
  }
}

// src/client/MobileKeyboard.ts
var KEYMAP_REGULAR = [
  "q",
  "w",
  "e",
  "r",
  "t",
  "y",
  "u",
  "i",
  "o",
  "p",
  "a",
  "s",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "Shift",
  "z",
  "x",
  "c",
  "v",
  "b",
  "n",
  "m",
  "Del",
  "123",
  ",",
  " ",
  ".",
  "Enter"
];
var KEYMAP_SHIFT = [
  "Q",
  "W",
  "E",
  "R",
  "T",
  "Y",
  "U",
  "I",
  "O",
  "P",
  "A",
  "S",
  "D",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "Shift",
  "Z",
  "X",
  "C",
  "V",
  "B",
  "N",
  "M",
  "Del",
  "123",
  ",",
  " ",
  ".",
  "Enter"
];
var KEYMAP_SYMBOLS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "!",
  '"',
  "$",
  "%",
  "_",
  "&",
  "*",
  "(",
  ")",
  "1/2",
  "@",
  "=",
  "<",
  ">",
  "~",
  ";",
  ":",
  "Del",
  "abc",
  "#",
  " ",
  "?",
  "Enter"
];
var KEYMAP_SYMBOLS_EXTRA = [
  "£",
  "^",
  "[",
  "]",
  "{",
  "}",
  "'",
  "-",
  "+",
  "/",
  "\\",
  "|",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "2/2",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "Del",
  "abc",
  "",
  " ",
  "",
  "Enter"
];
var CHAR_OFFSET_PER_ROW = [0, 10, 19, 28];
var WIDTH_PER_KEYBOX = 50;
var HEIGHT_PER_KEYBOX = 30;
var DRAG_TIMEOUT_MS = 1000;
var DRAG_MIN_DIST_PX = 5;
var DRAG_MAX_DIST_PX = 75;
function isFullScreen() {
  return document.fullscreenElement !== null;
}

class MobileKeyboard {
  canvasKeyboard;
  nativeKeyboard;
  mode;
  constructor() {
    this.canvasKeyboard = new CanvasMobileKeyboard;
    this.nativeKeyboard = new NativeMobileKeyboard;
    const savedMode = localStorage.getItem("mobileKeyboardMode");
    if (savedMode === "native") {
      this.mode = 1 /* Native */;
    } else if (savedMode === "canvas") {
      this.mode = 2 /* Canvas */;
    } else {
      this.mode = 0 /* Hybrid */;
    }
  }
  show(originX, originY, clientX, clientY) {
    if (this.mode === 0 /* Hybrid */) {
      if (isFullScreen()) {
        this.canvasKeyboard.show(originX, originY);
      } else {
        this.nativeKeyboard.show(clientX ?? originX, clientY ?? originY);
      }
    } else if (this.mode === 2 /* Canvas */) {
      this.canvasKeyboard.show(originX, originY);
    } else if (this.mode === 1 /* Native */) {
      this.nativeKeyboard.show(clientX ?? originX, clientY ?? originY);
    }
  }
  hide() {
    this.canvasKeyboard.hide();
    this.nativeKeyboard.hide();
  }
  draw() {
    this.canvasKeyboard.draw();
  }
  isDisplayed() {
    return this.canvasKeyboard.isDisplayed() || this.nativeKeyboard.isDisplayed();
  }
  isWithinCanvasKeyboard(x, y) {
    return this.canvasKeyboard.isDisplayed() && this.canvasKeyboard.posWithinKeyboard(x, y);
  }
  captureMouseUp(x, y) {
    if (this.canvasKeyboard.isDisplayed()) {
      return this.canvasKeyboard.captureMouseUp(x, y);
    } else if (this.nativeKeyboard.isDisplayed()) {
      return this.nativeKeyboard.captureMouseUp(x, y);
    }
    return false;
  }
  captureMouseDown(x, y) {
    if (this.canvasKeyboard.isDisplayed()) {
      return this.canvasKeyboard.captureMouseDown(x, y);
    } else if (this.nativeKeyboard.isDisplayed()) {
      return this.nativeKeyboard.captureMouseDown(x, y);
    }
    return false;
  }
  notifyTouchMove(x, y) {
    if (this.canvasKeyboard.isDisplayed()) {
      this.canvasKeyboard.notifyTouchMove(x, y);
    } else if (this.nativeKeyboard.isDisplayed()) {
      this.nativeKeyboard.notifyTouchMove(x, y);
    }
  }
}

class CanvasMobileKeyboard {
  displayed = false;
  height = HEIGHT_PER_KEYBOX * 4 + 10;
  width = WIDTH_PER_KEYBOX * 10 + 10;
  startX = 0;
  startY = 503 - this.height;
  mode = 0 /* Regular */;
  animateBoxIndex = -1;
  animateBoxTimeout = 0;
  touchStartAtX = 0;
  touchStartAtY = 0;
  touching = false;
  touchStartTimestamp = 0;
  getBoxColourForIndex(index) {
    if (this.animateBoxIndex > -1) {
      if (this.animateBoxIndex === index) {
        return "#a6a6a6";
      }
    }
    const char = this.getCharForIndex(index);
    if (char !== undefined && char.length > 1) {
      return "#a9afba";
    }
    return "#c8cdd1";
  }
  getBoxForIndex(index) {
    const lineIndex = index < CHAR_OFFSET_PER_ROW[1] ? 0 : index < CHAR_OFFSET_PER_ROW[2] ? 1 : index < CHAR_OFFSET_PER_ROW[3] ? 2 : 3;
    const offsetPos = index - CHAR_OFFSET_PER_ROW[lineIndex];
    const box = {
      startX: offsetPos * WIDTH_PER_KEYBOX + 5,
      startY: lineIndex * HEIGHT_PER_KEYBOX + 5,
      width: WIDTH_PER_KEYBOX,
      height: HEIGHT_PER_KEYBOX
    };
    if (lineIndex === 1) {
      box.startX += WIDTH_PER_KEYBOX / 2;
    }
    if (index === 30) {
      box.width *= 6;
    }
    if (index > 30) {
      box.startX += WIDTH_PER_KEYBOX * 5;
    }
    return box;
  }
  getCharForIndex(index) {
    if (this.mode === 1 /* Shift */) {
      return KEYMAP_SHIFT[index];
    } else if (this.mode === 2 /* Symbols */) {
      return KEYMAP_SYMBOLS[index];
    } else if (this.mode === 3 /* SymbolsExtra */) {
      return KEYMAP_SYMBOLS_EXTRA[index];
    }
    return KEYMAP_REGULAR[index];
  }
  drawKeyBoxes() {
    for (let i = 0;i < KEYMAP_REGULAR.length; i++) {
      const box = this.getBoxForIndex(i);
      canvas2d.fillStyle = this.getBoxColourForIndex(i);
      canvas2d.beginPath();
      canvas2d.roundRect(this.startX + box.startX + 2, this.startY + box.startY + 2, box.width - 2, box.height - 2, 5);
      canvas2d.fill();
    }
  }
  drawKeyChars() {
    canvas2d.fillStyle = "black";
    canvas2d.textAlign = "center";
    canvas2d.textBaseline = "middle";
    for (let i = 0;i < KEYMAP_REGULAR.length; i++) {
      canvas2d.font = "16px Roboto, sans-serif";
      const box = this.getBoxForIndex(i);
      const offsetXCanvas = this.startX + box.startX + WIDTH_PER_KEYBOX / 2;
      const offsetYCanvas = this.startY + box.startY + HEIGHT_PER_KEYBOX / 2 + 2;
      const char = this.getCharForIndex(i);
      if (char.length > 1) {
        canvas2d.font = "14px Roboto, sans-serif";
      }
      canvas2d.fillText(char, offsetXCanvas, offsetYCanvas);
    }
  }
  drawBackground() {
    canvas2d.fillStyle = "#dadde2";
    canvas2d.beginPath();
    canvas2d.roundRect(this.startX, this.startY, this.width, this.height, 5);
    canvas2d.fill();
  }
  draw() {
    if (!this.isDisplayed()) {
      return;
    }
    canvas2d.save();
    this.drawBackground();
    this.drawKeyBoxes();
    this.drawKeyChars();
    canvas2d.restore();
  }
  show(_originX, _originY) {
    this.mode = 0 /* Regular */;
    this.displayed = true;
  }
  hide() {
    this.displayed = false;
  }
  isDisplayed() {
    return this.displayed;
  }
  posWithinKeyboard(x, y) {
    const withinX = x >= this.startX && x < this.startX + this.width;
    const withinY = y >= this.startY && y < this.startY + this.height;
    return withinX && withinY;
  }
  getBoxIndexForClick(x, y) {
    const relativeX = x - this.startX;
    const relativeY = y - this.startY;
    if (relativeX < 0 || relativeY < 0 || relativeX >= this.width || relativeY >= this.height) {
      return -1;
    }
    const rowIndex = Math.floor(relativeY / HEIGHT_PER_KEYBOX);
    const columnIndex = Math.floor(relativeX / WIDTH_PER_KEYBOX);
    if (rowIndex === 0) {
      return columnIndex;
    }
    if (rowIndex === 1) {
      if (relativeX < WIDTH_PER_KEYBOX / 2 || relativeX > this.width - WIDTH_PER_KEYBOX / 2) {
        return -1;
      }
      return CHAR_OFFSET_PER_ROW[1] + Math.floor((relativeX - WIDTH_PER_KEYBOX / 2) / WIDTH_PER_KEYBOX);
    }
    if (rowIndex === 2) {
      if (columnIndex >= 9) {
        return -1;
      }
      return CHAR_OFFSET_PER_ROW[2] + columnIndex;
    }
    return CHAR_OFFSET_PER_ROW[3] + columnIndex;
  }
  getCharForClick(x, y) {
    const boxIndex = this.getBoxIndexForClick(x, y);
    if (boxIndex > -1) {
      let char = "";
      if (boxIndex >= 30 && boxIndex <= 35) {
        char = " ";
      } else if (boxIndex === 36) {
        char = this.getCharForIndex(31);
      } else if (boxIndex === 37) {
        char = "Enter";
      } else {
        char = this.getCharForIndex(boxIndex);
      }
      if (char === "Del") {
        char = "Backspace";
      }
      return char;
    }
    return "";
  }
  captureMouseDown(x, y) {
    if (this.posWithinKeyboard(x, y)) {
      return true;
    }
    return false;
  }
  captureMouseUp(x, y) {
    this.touching = false;
    if (this.posWithinKeyboard(x, y)) {
      const index = this.getBoxIndexForClick(x, y);
      const char = this.getCharForClick(x, y);
      if (char === "Shift") {
        if (this.mode === 0 /* Regular */) {
          this.mode = 1 /* Shift */;
        } else {
          this.mode = 0 /* Regular */;
        }
        return true;
      } else if (char === "123" || char === "2/2") {
        this.mode = 2 /* Symbols */;
        return true;
      } else if (char === "1/2") {
        this.mode = 3 /* SymbolsExtra */;
        return true;
      } else if (char === "abc") {
        this.mode = 0 /* Regular */;
        return true;
      } else if (char === "") {
        return true;
      }
      const downEvent = new KeyboardEvent("keydown", {
        key: char,
        code: char
      });
      const upEvent = new KeyboardEvent("keyup", {
        key: char,
        code: char
      });
      canvas.dispatchEvent(downEvent);
      canvas.dispatchEvent(upEvent);
      if (!this.animateBoxTimeout) {
        if (index >= 30 && index <= 35) {
          this.animateBoxIndex = 30;
        } else if (index > 35) {
          this.animateBoxIndex = index - 5;
        } else {
          this.animateBoxIndex = index;
        }
        this.animateBoxTimeout = window.setTimeout(() => {
          this.animateBoxIndex = -1;
          this.animateBoxTimeout = 0;
        }, 100);
      }
      return true;
    }
    return false;
  }
  notifyTouchMove(x, y) {
    if (!this.posWithinKeyboard(x, y)) {
      return;
    }
    if (this.touching && performance.now() > this.touchStartTimestamp + DRAG_TIMEOUT_MS) {
      this.touching = false;
      return;
    }
    if (!this.touching) {
      this.touching = true;
      this.touchStartTimestamp = performance.now();
      this.touchStartAtX = x - this.startX;
      this.touchStartAtY = y - this.startY;
      return;
    }
    const deltaX = Math.abs(Math.abs(this.touchStartAtX - x) - this.startX);
    const deltaY = Math.abs(Math.abs(this.touchStartAtY - y) - this.startY);
    if (deltaX > DRAG_MAX_DIST_PX || deltaY > DRAG_MAX_DIST_PX) {
      return;
    }
    if (deltaX > DRAG_MIN_DIST_PX || deltaY > DRAG_MIN_DIST_PX) {
      const newStartX = Math.max(0, Math.min(789 - this.width, x - this.touchStartAtX));
      const newStartY = Math.max(0, Math.min(532 - this.height, y - this.touchStartAtY));
      this.startX = newStartX;
      this.startY = newStartY;
      canvas.dispatchEvent(new FocusEvent("focus"));
    }
  }
}

class NativeMobileKeyboard {
  virtualInputElement;
  displayed = false;
  isAndroid = false;
  constructor() {
    this.isAndroid = navigator.userAgent.includes("Android");
    this.virtualInputElement = document.createElement("input");
    this.virtualInputElement.setAttribute("type", "password");
    this.virtualInputElement.setAttribute("autofocus", "autofocus");
    this.virtualInputElement.setAttribute("spellcheck", "false");
    this.virtualInputElement.setAttribute("autocomplete", "off");
    this.virtualInputElement.setAttribute("autocorrect", "off");
    this.virtualInputElement.setAttribute("autocapitalize", "off");
    this.virtualInputElement.setAttribute("style", "position: fixed; top: 0px; left: 0px; width: 1px; height: 1px; opacity: 0;");
    if (this.isAndroid) {
      this.virtualInputElement.addEventListener("input", (ev) => {
        if (!(ev instanceof InputEvent)) {
          return;
        }
        const data = ev.data;
        if (data === null) {
          return;
        }
        if (ev.inputType !== "insertText") {
          return;
        }
        canvas.dispatchEvent(new KeyboardEvent("keydown", { key: data, code: data }));
        canvas.dispatchEvent(new KeyboardEvent("keyup", { key: data, code: data }));
      });
      this.virtualInputElement.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === "Backspace") {
          canvas.dispatchEvent(new KeyboardEvent("keydown", { key: ev.key, code: ev.key }));
        }
      });
      this.virtualInputElement.addEventListener("keyup", (ev) => {
        if (ev.key === "Enter" || ev.key === "Backspace") {
          canvas.dispatchEvent(new KeyboardEvent("keyup", { key: ev.key, code: ev.key }));
        }
      });
    } else {
      this.virtualInputElement.addEventListener("keydown", (ev) => {
        canvas.dispatchEvent(new KeyboardEvent("keydown", { key: ev.key, code: ev.key }));
      });
      this.virtualInputElement.addEventListener("keyup", (ev) => {
        canvas.dispatchEvent(new KeyboardEvent("keyup", { key: ev.key, code: ev.key }));
      });
    }
    document.body.appendChild(this.virtualInputElement);
  }
  draw() {}
  show(originX, originY) {
    if (originX && originY) {
      this.virtualInputElement.style.left = `${originX}px`;
      this.virtualInputElement.style.top = `${originY}px`;
    }
    canvas.blur();
    this.virtualInputElement.focus();
    this.virtualInputElement.click();
    this.displayed = true;
  }
  hide() {
    this.virtualInputElement.blur();
    canvas.focus();
    this.displayed = false;
  }
  isDisplayed() {
    return this.displayed;
  }
  captureMouseUp(_x, _y) {
    return false;
  }
  captureMouseDown(_x, _y) {
    return false;
  }
  notifyTouchMove(_x, _y) {
    return;
  }
}
var MobileKeyboard_default = new MobileKeyboard;

// src/client/Client.ts
var CLIENT_VERSION = 225;
var MAX_PLAYER_COUNT = 2048;
var LOCAL_PLAYER_INDEX = 2047;
var MAX_CHATS = 50;
var CHAT_COLOURS = [16776960 /* YELLOW */, 16711680 /* RED */, 65280 /* GREEN */, 65535 /* CYAN */, 16711935 /* MAGENTA */, 16777215 /* WHITE */];
var SCROLLBAR_TRACK = 2301979;
var SCROLLBAR_GRIP_FOREGROUND = 5063219;
var SCROLLBAR_GRIP_HIGHLIGHT = 7759444;
var SCROLLBAR_GRIP_LOWLIGHT = 3353893;

class Client extends GameShell {
  static nodeId = 10;
  static memServer = true;
  static lowMem = false;
  static cyclelogic1 = 0;
  static cyclelogic2 = 0;
  static cyclelogic3 = 0;
  static cyclelogic4 = 0;
  static cyclelogic5 = 0;
  static cyclelogic6 = 0;
  static cyclelogic7 = 0;
  static cyclelogic8 = 0;
  static cyclelogic9 = 0;
  static cyclelogic10 = 0;
  static oplogic1 = 0;
  static oplogic2 = 0;
  static oplogic3 = 0;
  static oplogic4 = 0;
  static oplogic5 = 0;
  static oplogic6 = 0;
  static oplogic7 = 0;
  static oplogic8 = 0;
  static oplogic9 = 0;
  static oplogic10 = 0;
  static levelExperience = [];
  static {
    let acc = 0;
    for (let i = 0;i < 99; i++) {
      const level = i + 1;
      const delta = level + Math.pow(2, level / 7) * 300 | 0;
      acc += delta;
      Client.levelExperience[i] = acc / 4 | 0;
    }
  }
  alreadyStarted = false;
  errorStarted = false;
  errorLoading = false;
  errorHost = false;
  errorMessage = null;
  ingame = false;
  loopCycle = 0;
  showFps = false;
  rebootTimer = 0;
  hintType = 0;
  hintNpc = 0;
  hintPlayer = 0;
  hintTileX = 0;
  hintTileZ = 0;
  hintHeight = 0;
  hintOffsetX = 0;
  hintOffsetZ = 0;
  lastAddress = 0;
  daysSinceLastLogin = 0;
  daysSinceRecoveriesChanged = 0;
  unreadMessages = 0;
  db = null;
  jagChecksum = [];
  npc = new TypedArray1d(8192, null);
  npcCount = 0;
  npcIds = new Int32Array(8192);
  stream = null;
  loginSeed = 0n;
  randomIn = null;
  out = Packet.alloc(1);
  loginout = Packet.alloc(1);
  in = Packet.alloc(1);
  psize = 0;
  ptype = 0;
  timeoutTimer = 0;
  noTimeoutTimer = 0;
  logoutTimer = 0;
  ptype0 = 0;
  ptype1 = 0;
  ptype2 = 0;
  title = null;
  p11 = null;
  p12 = null;
  b12 = null;
  q8 = null;
  mapBuildBaseX = 0;
  mapBuildBaseZ = 0;
  mapBuildPrevBaseX = 0;
  mapBuildPrevBaseZ = 0;
  sceneState = 0;
  awaitingPlayerInfo = false;
  mapBuildCentreZoneX = 0;
  mapBuildCentreZoneZ = 0;
  mapBuildIndex = null;
  mapBuildGroundReady = null;
  mapBuildLocationReady = null;
  mapBuildGroundData = null;
  mapBuildLocationData = null;
  world = null;
  mapl = null;
  groundh = null;
  collision = new TypedArray1d(4 /* LEVELS */, null);
  textureBuffer = new Int8Array(16384);
  zoneUpdateX = 0;
  zoneUpdateZ = 0;
  tryMoveNearest = 0;
  dirMap = new Int32Array(104 /* SIZE */ * 104 /* SIZE */);
  distMap = new Int32Array(104 /* SIZE */ * 104 /* SIZE */);
  routeX = new Int32Array(4000);
  routeZ = new Int32Array(4000);
  macroCameraX = 0;
  macroCameraXModifier = 2;
  macroCameraZ = 0;
  macroCameraZModifier = 2;
  macroCameraAngle = 0;
  macroCameraAngleModifier = 1;
  macroCameraCycle = 0;
  macroMinimapAngle = 0;
  macroMinimapAngleModifier = 2;
  macroMinimapZoom = 0;
  macroMinimapZoomModifier = 1;
  macroMinimapCycle = 0;
  worldUpdateNum = 0;
  minimap = null;
  compass = null;
  mapscene = new TypedArray1d(50, null);
  mapfunction = new TypedArray1d(50, null);
  hitmarks = new TypedArray1d(20, null);
  headicons = new TypedArray1d(20, null);
  mapflag = null;
  cross = new TypedArray1d(8, null);
  mapdots1 = null;
  mapdots2 = null;
  mapdots3 = null;
  mapdots4 = null;
  scrollbar1 = null;
  scrollbar2 = null;
  redrawFrame = true;
  imageTitle2 = null;
  imageTitle3 = null;
  imageTitle4 = null;
  imageTitle0 = null;
  imageTitle1 = null;
  imageTitle5 = null;
  imageTitle6 = null;
  imageTitle7 = null;
  imageTitle8 = null;
  imageTitlebox = null;
  imageTitlebutton = null;
  loginscreen = 0;
  loginSelect = 0;
  loginMes1 = "";
  loginMes2 = "";
  loginUser = "";
  loginPass = "";
  imageRunes = [];
  flameActive = false;
  imageFlamesLeft = null;
  imageFlamesRight = null;
  flameBuffer1 = null;
  flameBuffer0 = null;
  flameBuffer3 = null;
  flameBuffer2 = null;
  flameGradient = null;
  flameGradient0 = null;
  flameGradient1 = null;
  flameGradient2 = null;
  flameLineOffset = new Int32Array(256);
  flameCycle0 = 0;
  flameGradientCycle0 = 0;
  flameGradientCycle1 = 0;
  flamesInterval = null;
  areaSidebar = null;
  areaMapback = null;
  areaViewport = null;
  areaChatback = null;
  areaBackbase1 = null;
  areaBackbase2 = null;
  areaBackhmid1 = null;
  areaBackleft1 = null;
  areaBackleft2 = null;
  areaBackright1 = null;
  areaBackright2 = null;
  areaBacktop1 = null;
  areaBacktop2 = null;
  areaBackvmid1 = null;
  areaBackvmid2 = null;
  areaBackvmid3 = null;
  areaBackhmid2 = null;
  chatbackScanline = null;
  sidebarScanline = null;
  viewportScanline = null;
  invback = null;
  chatback = null;
  backbase1 = null;
  backbase2 = null;
  backhmid1 = null;
  sideicons = new TypedArray1d(13, null);
  redstone1 = null;
  redstone2 = null;
  redstone3 = null;
  redstone1h = null;
  redstone2h = null;
  redstone1v = null;
  redstone2v = null;
  redstone3v = null;
  redstone1hv = null;
  redstone2hv = null;
  redrawSidebar = false;
  redrawChatback = false;
  redrawSideicons = false;
  redrawPrivacySettings = false;
  mapback = null;
  compassMaskLineOffsets = new Int32Array(33);
  compassMaskLineLengths = new Int32Array(33);
  minimapMaskLineOffsets = new Int32Array(151);
  minimapMaskLineLengths = new Int32Array(151);
  scrollGrabbed = false;
  scrollInputPadding = 0;
  scrollCycle = 0;
  camX = 0;
  camY = 0;
  camZ = 0;
  camPitch = 0;
  camYaw = 0;
  orbitCameraPitch = 128;
  orbitCameraYaw = 0;
  orbitCameraYawVelocity = 0;
  orbitCameraPitchVelocity = 0;
  orbitCameraX = 0;
  orbitCameraZ = 0;
  cameraMovedWrite = 0;
  cameraPitchClamp = 0;
  chatCount = 0;
  chatX = new Int32Array(MAX_CHATS);
  chatY = new Int32Array(MAX_CHATS);
  chatHeight = new Int32Array(MAX_CHATS);
  chatWidth = new Int32Array(MAX_CHATS);
  chatColour = new Int32Array(MAX_CHATS);
  chatEffect = new Int32Array(MAX_CHATS);
  chatTimer = new Int32Array(MAX_CHATS);
  chats = new TypedArray1d(MAX_CHATS, null);
  tileLastOccupiedCycle = new Int32Array2d(104 /* SIZE */, 104 /* SIZE */);
  sceneCycle = 0;
  projectX = 0;
  projectY = 0;
  crossX = 0;
  crossY = 0;
  crossCycle = 0;
  crossMode = 0;
  selectedArea = 0;
  selectedComId = 0;
  selectedItem = 0;
  selectedCycle = 0;
  objDragArea = 0;
  objDragComId = 0;
  hoveredSlotComId = 0;
  objDragSlot = 0;
  objGrabX = 0;
  objGrabY = 0;
  hoveredSlot = 0;
  objGrabThreshold = false;
  objDragCycles = 0;
  inMultizone = 0;
  chatDisabled = 0;
  wildernessLevel = 0;
  worldLocationState = 0;
  players = new TypedArray1d(MAX_PLAYER_COUNT, null);
  playerCount = 0;
  playerIds = new Int32Array(MAX_PLAYER_COUNT);
  entityUpdateCount = 0;
  entityUpdateIds = new Int32Array(MAX_PLAYER_COUNT);
  playerAppearanceBuffer = new TypedArray1d(MAX_PLAYER_COUNT, null);
  minusedlevel = 0;
  selfSlot = -1;
  localPlayer = null;
  refBuild = null;
  refNeedCapture = false;
  entityRemovalCount = 0;
  entityRemovalIds = new Int32Array(1000);
  groundObj = new TypedArray3d(4 /* LEVELS */, 104 /* SIZE */, 104 /* SIZE */, null);
  locChanges = new LinkList;
  projectiles = new LinkList;
  spotanims = new LinkList;
  locList = new LinkList;
  statEffectiveLevel = [];
  statBaseLevel = [];
  statXP = [];
  oneMouseButton = 0;
  isMenuOpen = false;
  menuNumEntries = 0;
  menuArea = 0;
  menuX = 0;
  menuY = 0;
  menuWidth = 0;
  menuHeight = 0;
  menuParamB = new Int32Array(500);
  menuParamC = new Int32Array(500);
  menuAction = new Int32Array(500);
  menuParamA = new Int32Array(500);
  menuOption = [];
  useMode = 0;
  objComId = 0;
  objSelectedName = null;
  objSelectedComId = 0;
  objSelectedSlot = 0;
  targetMode = 0;
  targetComId = 0;
  targetMask = 0;
  targetOp = null;
  chatComId = -1;
  mainModalId = -1;
  sideModalId = -1;
  lastOverComId = 0;
  overChatComId = 0;
  overMainComId = 0;
  overSideComId = 0;
  sideTab = 3;
  sideOverlayId = [
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1
  ];
  tutComId = -1;
  tutComMessage = null;
  tutFlashingTab = -1;
  chatEffects = 0;
  splitPrivateChat = 0;
  resumedPauseButton = false;
  runenergy = 0;
  runweight = 0;
  staffmod = false;
  var = [];
  varServ = [];
  chatInterface = new IfType;
  chatScrollHeight = 78;
  chatScrollPos = 0;
  chatInput = "";
  chatType = new Int32Array(100);
  chatUsername = new TypedArray1d(100, null);
  chatText = new TypedArray1d(100, null);
  chatPublicMode = 0;
  chatPrivateMode = 0;
  chatTradeMode = 0;
  privateMessageIds = new Int32Array(100);
  privateMessageCount = 0;
  socialUserhash = null;
  socialInputOpen = false;
  socialInput = "";
  socialInputType = 0;
  socialInputHeader = "";
  dialogInputOpen = false;
  dialogInput = "";
  reportAbuseInput = "";
  reportAbuseMuteOption = false;
  reportAbuseComId = -1;
  minimapLevel = -1;
  activeMapFunctionCount = 0;
  activeMapFunctionX = new Int32Array(1000);
  activeMapFunctionZ = new Int32Array(1000);
  activeMapFunctions = new TypedArray1d(1000, null);
  minimapFlagX = 0;
  minimapFlagZ = 0;
  midiActive = true;
  midiVolume = 0;
  midiSong = null;
  midiCrc = 0;
  midiSize = 0;
  nextMusicDelay = 0;
  waveEnabled = true;
  waveVolume = 0;
  waveCount = 0;
  waveIds = new Int32Array(50);
  waveLoops = new Int32Array(50);
  waveDelay = new Int32Array(50);
  lastWaveId = -1;
  lastWaveLoops = -1;
  lastWaveLength = 0;
  lastWaveStartTime = 0;
  cinemaCam = false;
  camShake = new TypedArray1d(5, false);
  camShakeAxis = new Int32Array(5);
  camShakeRan = new Int32Array(5);
  camShakeAmp = new Int32Array(5);
  camShakeCycle = new Int32Array(5);
  camMoveToLx = 0;
  camMoveToLz = 0;
  camMoveToHei = 0;
  camMoveToRate = 0;
  camMoveToRate2 = 0;
  camLookAtLx = 0;
  camLookAtLz = 0;
  camLookAtHei = 0;
  camLookAtRate = 0;
  camLookAtRate2 = 0;
  friendCount = 0;
  friendUsername = new TypedArray1d(100, null);
  friendUserhash = new BigInt64Array(100);
  friendNodeId = new Int32Array(100);
  ignoreCount = 0;
  ignoreUserhash = [];
  idkDesignGender = true;
  idkDesignRedraw = false;
  idkDesignPart = new Int32Array(7);
  idkDesignColour = new Int32Array(5);
  idkDesignButton1 = null;
  idkDesignButton2 = null;
  constructor(nodeid, lowmem, members) {
    super();
    if (typeof nodeid === "undefined" || typeof lowmem === "undefined" || typeof members === "undefined") {
      return;
    }
    console.log(`RS2 user client - release #${CLIENT_VERSION}`);
    Client.nodeId = nodeid;
    Client.memServer = members;
    if (lowmem) {
      Client.setLowMem();
    } else {
      Client.setHighMem();
    }
    this.run();
  }
  static setLowMem() {
    World.lowMem = true;
    Pix3D.lowMem = true;
    Client.lowMem = true;
    ClientBuild.lowMem = true;
  }
  static setHighMem() {
    World.lowMem = false;
    Pix3D.lowMem = false;
    Client.lowMem = false;
    ClientBuild.lowMem = false;
  }
  async saveMidi(name, crc, length, fade) {
    try {
      let data = await this.db?.cacheload(name + ".mid");
      if (data && crc !== 12345678 && Packet.getcrc(data, 0, data.length) !== crc) {
        data = undefined;
      }
      if (!data || !data.length) {
        try {
          data = await downloadUrl(`/${name}_${crc}.mid`);
          if (length !== data.length) {
            data = data.slice(0, length);
          }
        } catch (e) {}
      }
      if (!data) {
        return;
      }
      try {
        await this.db?.cachesave(name + ".mid", data);
        const uncompressed = bzip2_wasm_default.decompress(data, -1, false, true);
        playMidi(uncompressed, this.midiVolume, fade);
      } catch (e) {}
    } catch (e) {}
  }
  drawError() {
    canvas2d.fillStyle = "black";
    canvas2d.fillRect(0, 0, this.sWid, this.sHei);
    this.setFramerate(1);
    this.flameActive = false;
    let y = 0;
    if (this.errorLoading) {
      canvas2d.font = "bold 16px helvetica, sans-serif";
      canvas2d.textAlign = "left";
      canvas2d.fillStyle = "yellow";
      y = 35;
      canvas2d.fillText("Sorry, an error has occured whilst loading RuneScape", 30, y);
      y += 50;
      canvas2d.fillStyle = "white";
      canvas2d.fillText("To fix this try the following (in order):", 30, y);
      y += 50;
      canvas2d.font = "bold 12px helvetica, sans-serif";
      canvas2d.fillText("1: Try closing ALL open web-browser windows, and reloading", 30, y);
      y += 30;
      canvas2d.fillText("2: Try clearing your web-browsers cache", 30, y);
      y += 30;
      canvas2d.fillText("3: Try using a different game-world", 30, y);
      y += 30;
      canvas2d.fillText("4: Try rebooting your computer", 30, y);
      y += 30;
      canvas2d.fillText("5: Try selecting a different method from the play-game menu", 30, y);
    } else if (this.errorHost) {
      canvas2d.font = "bold 20px helvetica, sans-serif";
      canvas2d.textAlign = "left";
      canvas2d.fillStyle = "white";
      y = 50;
      canvas2d.fillText("Error - unable to load game!", 50, y);
      y += 50;
      canvas2d.fillText("To play RuneScape make sure you play from", 50, y);
      y += 50;
      canvas2d.fillText("An approved domain", 50, y);
    } else if (this.errorStarted) {
      canvas2d.font = "bold 13px helvetica, sans-serif";
      canvas2d.textAlign = "left";
      canvas2d.fillStyle = "yellow";
      y = 35;
      canvas2d.fillText("Error a copy of RuneScape already appears to be loaded", 30, y);
      y += 50;
      canvas2d.fillStyle = "white";
      canvas2d.fillText("To fix this try the following (in order):", 30, y);
      y += 50;
      canvas2d.font = "bold 12px helvetica, sans-serif";
      canvas2d.fillText("1: Try closing ALL open web-browser windows, and reloading", 30, y);
      y += 30;
      canvas2d.fillText("2: Try rebooting your computer, and reloading", 30, y);
    }
    if (this.errorMessage) {
      y += 50;
      canvas2d.fillStyle = "red";
      canvas2d.fillText("Error: " + this.errorMessage, 30, y);
    }
  }
  async getJagFile(filename, displayName, crc, progress) {
    let retry = 5;
    let data = await this.db?.cacheload(filename);
    if (data && Packet.getcrc(data, 0, data.length) !== crc) {
      data = undefined;
    }
    if (data) {
      return new JagFile(data);
    }
    while (!data) {
      await this.messageBox(progress, `Requesting ${displayName}`);
      try {
        data = await downloadUrl(`/${filename}${crc}`);
      } catch (_e) {
        data = undefined;
        for (let i = retry;i > 0; i--) {
          await this.messageBox(progress, `Error loading - Will retry in ${i} secs.`);
          await sleep(1000);
        }
        retry *= 2;
        if (retry > 60) {
          retry = 60;
        }
      }
    }
    await this.db?.cachesave(filename, data);
    return new JagFile(data);
  }
  async maininit() {
    if (this.isMobile && Client.lowMem) {
      this.setTargetedFramerate(30);
    }
    if (this.alreadyStarted) {
      this.errorStarted = true;
      return;
    }
    this.alreadyStarted = true;
    if (false) {}
    try {
      this.db = new Database(await Database.openDatabase());
    } catch (_e) {
      this.db = null;
    }
    await bzip2_wasm_default.init();
    try {
      await this.messageBox(10, "Connecting to fileserver");
      const checksums = new Packet(await downloadUrl("/crc"));
      for (let i = 0;i < 9; i++) {
        this.jagChecksum[i] = checksums.g4();
      }
      if (!Client.lowMem) {
        await this.saveMidi("scape_main", 12345678, 40000, false);
      }
      this.title = await this.getJagFile("title", "title screen", this.jagChecksum[1], 10);
      this.p11 = PixFont.depack(this.title, "p11");
      this.p12 = PixFont.depack(this.title, "p12");
      this.b12 = PixFont.depack(this.title, "b12");
      this.q8 = PixFont.depack(this.title, "q8");
      await this.loadTitleBackground();
      this.loadTitleImages();
      const config = await this.getJagFile("config", "config", this.jagChecksum[2], 15);
      const interfaces = await this.getJagFile("interface", "interface", this.jagChecksum[3], 20);
      const media = await this.getJagFile("media", "2d graphics", this.jagChecksum[4], 30);
      const models = await this.getJagFile("models", "3d graphics", this.jagChecksum[5], 40);
      const textures = await this.getJagFile("textures", "textures", this.jagChecksum[6], 60);
      const wordenc = await this.getJagFile("wordenc", "chat system", this.jagChecksum[7], 65);
      const sounds = await this.getJagFile("sounds", "sound effects", this.jagChecksum[8], 70);
      this.mapl = new Uint8Array3d(4 /* LEVELS */, 104 /* SIZE */, 104 /* SIZE */);
      this.groundh = new Int32Array3d(4 /* LEVELS */, 104 /* SIZE */ + 1, 104 /* SIZE */ + 1);
      this.world = new World(this.groundh, 104 /* SIZE */, 4 /* LEVELS */, 104 /* SIZE */);
      for (let level = 0;level < 4 /* LEVELS */; level++) {
        this.collision[level] = new CollisionMap;
      }
      this.minimap = new Pix32(512, 512);
      await this.messageBox(75, "Unpacking media");
      this.invback = Pix8.depack(media, "invback", 0);
      this.chatback = Pix8.depack(media, "chatback", 0);
      this.mapback = Pix8.depack(media, "mapback", 0);
      this.backbase1 = Pix8.depack(media, "backbase1", 0);
      this.backbase2 = Pix8.depack(media, "backbase2", 0);
      this.backhmid1 = Pix8.depack(media, "backhmid1", 0);
      for (let i = 0;i < 13; i++) {
        this.sideicons[i] = Pix8.depack(media, "sideicons", i);
      }
      this.compass = Pix32.depack(media, "compass", 0);
      try {
        for (let i = 0;i < 50; i++) {
          if (i === 22) {
            continue;
          }
          this.mapscene[i] = Pix8.depack(media, "mapscene", i);
        }
      } catch (_e) {}
      try {
        for (let i = 0;i < 50; i++) {
          this.mapfunction[i] = Pix32.depack(media, "mapfunction", i);
        }
      } catch (_e) {}
      try {
        for (let i = 0;i < 20; i++) {
          this.hitmarks[i] = Pix32.depack(media, "hitmarks", i);
        }
      } catch (_e) {}
      try {
        for (let i = 0;i < 20; i++) {
          this.headicons[i] = Pix32.depack(media, "headicons", i);
        }
      } catch (_e) {}
      this.mapflag = Pix32.depack(media, "mapflag", 0);
      for (let i = 0;i < 8; i++) {
        this.cross[i] = Pix32.depack(media, "cross", i);
      }
      this.mapdots1 = Pix32.depack(media, "mapdots", 0);
      this.mapdots2 = Pix32.depack(media, "mapdots", 1);
      this.mapdots3 = Pix32.depack(media, "mapdots", 2);
      this.mapdots4 = Pix32.depack(media, "mapdots", 3);
      this.scrollbar1 = Pix8.depack(media, "scrollbar", 0);
      this.scrollbar2 = Pix8.depack(media, "scrollbar", 1);
      this.redstone1 = Pix8.depack(media, "redstone1", 0);
      this.redstone2 = Pix8.depack(media, "redstone2", 0);
      this.redstone3 = Pix8.depack(media, "redstone3", 0);
      this.redstone1h = Pix8.depack(media, "redstone1", 0);
      this.redstone1h?.hflip();
      this.redstone2h = Pix8.depack(media, "redstone2", 0);
      this.redstone2h?.hflip();
      this.redstone1v = Pix8.depack(media, "redstone1", 0);
      this.redstone1v?.vflip();
      this.redstone2v = Pix8.depack(media, "redstone2", 0);
      this.redstone2v?.vflip();
      this.redstone3v = Pix8.depack(media, "redstone3", 0);
      this.redstone3v?.vflip();
      this.redstone1hv = Pix8.depack(media, "redstone1", 0);
      this.redstone1hv?.hflip();
      this.redstone1hv?.vflip();
      this.redstone2hv = Pix8.depack(media, "redstone2", 0);
      this.redstone2hv?.hflip();
      this.redstone2hv?.vflip();
      const backleft1 = Pix32.depack(media, "backleft1", 0);
      this.areaBackleft1 = new PixMap(backleft1.wi, backleft1.hi);
      backleft1.quickPlotSprite(0, 0);
      const backleft2 = Pix32.depack(media, "backleft2", 0);
      this.areaBackleft2 = new PixMap(backleft2.wi, backleft2.hi);
      backleft2.quickPlotSprite(0, 0);
      const backright1 = Pix32.depack(media, "backright1", 0);
      this.areaBackright1 = new PixMap(backright1.wi, backright1.hi);
      backright1.quickPlotSprite(0, 0);
      const backright2 = Pix32.depack(media, "backright2", 0);
      this.areaBackright2 = new PixMap(backright2.wi, backright2.hi);
      backright2.quickPlotSprite(0, 0);
      const backtop1 = Pix32.depack(media, "backtop1", 0);
      this.areaBacktop1 = new PixMap(backtop1.wi, backtop1.hi);
      backtop1.quickPlotSprite(0, 0);
      const backtop2 = Pix32.depack(media, "backtop2", 0);
      this.areaBacktop2 = new PixMap(backtop2.wi, backtop2.hi);
      backtop2.quickPlotSprite(0, 0);
      const backvmid1 = Pix32.depack(media, "backvmid1", 0);
      this.areaBackvmid1 = new PixMap(backvmid1.wi, backvmid1.hi);
      backvmid1.quickPlotSprite(0, 0);
      const backvmid2 = Pix32.depack(media, "backvmid2", 0);
      this.areaBackvmid2 = new PixMap(backvmid2.wi, backvmid2.hi);
      backvmid2.quickPlotSprite(0, 0);
      const backvmid3 = Pix32.depack(media, "backvmid3", 0);
      this.areaBackvmid3 = new PixMap(backvmid3.wi, backvmid3.hi);
      backvmid3.quickPlotSprite(0, 0);
      const backhmid2 = Pix32.depack(media, "backhmid2", 0);
      this.areaBackhmid2 = new PixMap(backhmid2.wi, backhmid2.hi);
      backhmid2.quickPlotSprite(0, 0);
      const randR = (Math.random() * 21 | 0) - 10;
      const randG = (Math.random() * 21 | 0) - 10;
      const randB = (Math.random() * 21 | 0) - 10;
      const rand = (Math.random() * 41 | 0) - 20;
      for (let i = 0;i < 50; i++) {
        if (this.mapfunction[i]) {
          this.mapfunction[i]?.rgbAdjust(randR + rand, randG + rand, randB + rand);
        }
        if (this.mapscene[i]) {
          this.mapscene[i]?.rgbAdjust(randR + rand, randG + rand, randB + rand);
        }
      }
      await this.messageBox(80, "Unpacking textures");
      Pix3D.unpackTextures(textures);
      Pix3D.initColourTable(0.8);
      Pix3D.initPool(20);
      await this.messageBox(83, "Unpacking models");
      Model.init(models);
      AnimBase.init(models);
      AnimFrame.init(models);
      await this.messageBox(86, "Unpacking config");
      SeqType.init(config);
      LocType.init(config);
      FloType.init(config);
      ObjType.init(config, Client.memServer);
      NpcType.init(config);
      IdkType.init(config);
      SpotType.init(config);
      VarpType.init(config);
      if (!Client.lowMem) {
        await this.messageBox(90, "Unpacking sounds");
        const soundsDat = sounds.read("sounds.dat");
        JagFX.init(new Packet(soundsDat));
      }
      await this.messageBox(92, "Unpacking interfaces");
      IfType.init(interfaces, media, [this.p11, this.p12, this.b12, this.q8]);
      await this.messageBox(97, "Preparing game engine");
      for (let y = 0;y < 33; y++) {
        let left = 999;
        let right = 0;
        for (let x = 0;x < 35; x++) {
          if (this.mapback.data[x + y * this.mapback.wi] === 0) {
            if (left === 999) {
              left = x;
            }
          } else if (left !== 999) {
            right = x;
            break;
          }
        }
        this.compassMaskLineOffsets[y] = left;
        this.compassMaskLineLengths[y] = right - left;
      }
      for (let y = 9;y < 160; y++) {
        let left = 999;
        let right = 0;
        for (let x = 10;x < 168; x++) {
          if (this.mapback.data[x + y * this.mapback.wi] === 0 && (x > 34 || y > 34)) {
            if (left === 999) {
              left = x;
            }
          } else if (left !== 999) {
            right = x;
            break;
          }
        }
        this.minimapMaskLineOffsets[y - 9] = left - 21;
        this.minimapMaskLineLengths[y - 9] = right - left;
      }
      Pix3D.setClipping(479, 96);
      this.chatbackScanline = Pix3D.scanline;
      Pix3D.setClipping(190, 261);
      this.sidebarScanline = Pix3D.scanline;
      Pix3D.setClipping(512, 334);
      this.viewportScanline = Pix3D.scanline;
      const distance = new Int32Array(9);
      for (let x = 0;x < 9; x++) {
        const angle = x * 32 + 128 + 15;
        const offset = angle * 3 + 600;
        const sin = Pix3D.sinTable[angle];
        distance[x] = offset * sin >> 16;
      }
      World.resetVisCalc(512, 334, 500, 800, distance);
      WordFilter.unpack(wordenc);
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        this.errorMessage = e.message;
      }
      this.errorLoading = true;
    }
  }
  async mainloop() {
    if (this.errorStarted || this.errorLoading || this.errorHost) {
      return;
    }
    this.loopCycle++;
    if (!this.ingame) {
      await this.titleScreenLoop();
    } else {
      await this.gameLoop();
    }
  }
  async maindraw() {
    if (this.errorStarted || this.errorLoading || this.errorHost) {
      this.drawError();
      return;
    }
    if (!this.ingame) {
      await this.titleScreenDraw();
    } else {
      this.gameDraw();
    }
    if (this.isMobile) {
      MobileKeyboard_default.draw();
    }
    this.scrollCycle = 0;
  }
  refresh() {
    this.redrawFrame = true;
  }
  stealShiftS() {
    if (!this.ingame || this.chatInput.length > 0) {
      return false;
    }
    this.out.p1Enc(4 /* CLIENT_CHEAT */);
    this.out.p1("maxme".length + 1);
    this.out.pjstr("maxme");
    return true;
  }
  stealF12() {
    if (!this.ingame || !this.localPlayer) {
      return false;
    }
    const wx = (this.localPlayer.x >> 7) + this.mapBuildBaseX;
    const wz = (this.localPlayer.z >> 7) + this.mapBuildBaseZ;
    RefCapture.toggle(wx, wz, (msg) => this.addChat(0, msg, ""));
    return true;
  }
  stealF7() {
    if (!this.ingame || !this.localPlayer) {
      return false;
    }
    const wx = (this.localPlayer.x >> 7) + this.mapBuildBaseX;
    const wz = (this.localPlayer.z >> 7) + this.mapBuildBaseZ;
    RefAnimLog.toggle(wx, wz, (msg) => this.addChat(0, msg, ""));
    return true;
  }
  stealF10() {
    if (!this.ingame || !this.localPlayer) {
      return false;
    }
    const wx = (this.localPlayer.x >> 7) + this.mapBuildBaseX;
    const wz = (this.localPlayer.z >> 7) + this.mapBuildBaseZ;
    RefCapture.dumpHouse({
      loopCycle: this.loopCycle,
      wx,
      wz,
      camYaw: this.camYaw,
      camPitch: this.camPitch,
      mapBuildBaseX: this.mapBuildBaseX,
      mapBuildBaseZ: this.mapBuildBaseZ,
      groundh: this.groundh,
      collision: this.collision,
      world: this.world,
      build: this.refBuild,
      level: this.minusedlevel
    }, (msg) => this.addChat(0, msg, ""));
    return true;
  }
  stealF9() {
    if (!this.ingame || !this.localPlayer) {
      return false;
    }
    const wx = (this.localPlayer.x >> 7) + this.mapBuildBaseX;
    const wz = (this.localPlayer.z >> 7) + this.mapBuildBaseZ;
    RefCapture.dumpRoof({
      loopCycle: this.loopCycle,
      wx,
      wz,
      camYaw: this.camYaw,
      camPitch: this.camPitch,
      mapBuildBaseX: this.mapBuildBaseX,
      mapBuildBaseZ: this.mapBuildBaseZ,
      groundh: this.groundh,
      collision: this.collision,
      world: this.world,
      build: this.refBuild,
      level: this.minusedlevel,
      mapl: this.mapl
    }, (msg) => this.addChat(0, msg, ""));
    return true;
  }
  collectEntityAnimDump() {
    const empty = { playerLines: [], npcLines: [], seqLines: [] };
    try {
      const playerLines = [];
      const npcLines = [];
      const players = [];
      const npcs = [];
      for (let i = -1;i < this.playerCount; i++) {
        const index = i === -1 ? LOCAL_PLAYER_INDEX : this.playerIds[i];
        const player = this.players[index];
        if (!player) {
          continue;
        }
        players.push(player);
        playerLines.push(playerAnimLine(index, player, this.mapBuildBaseX, this.mapBuildBaseZ));
      }
      for (let i = 0;i < this.npcCount; i++) {
        const index = this.npcIds[i];
        const npc = this.npc[index];
        if (!npc || !npc.type) {
          continue;
        }
        npcs.push(npc);
        npcLines.push(npcAnimLine(index, npc, this.mapBuildBaseX, this.mapBuildBaseZ));
      }
      return { playerLines, npcLines, seqLines: formatSeqBlock(collectSeqIds(players, npcs)) };
    } catch (e) {
      console.warn("entity anim dump failed", e);
      return empty;
    }
  }
  buildAnimLogDump() {
    const wx = (this.localPlayer.x >> 7) + this.mapBuildBaseX;
    const wz = (this.localPlayer.z >> 7) + this.mapBuildBaseZ;
    const lines = [];
    lines.push(`tick loopCycle=${this.loopCycle} t=${new Date().toISOString()} ${wx},${wz} players=${this.playerCount + 1} npcs=${this.npcCount}`);
    try {
      const dump = this.collectEntityAnimDump();
      lines.push("PLAYERS");
      if (dump.playerLines.length === 0) {
        lines.push("(none)");
      } else {
        lines.push(...dump.playerLines);
      }
      lines.push("NPCS");
      if (dump.npcLines.length === 0) {
        lines.push("(none)");
      } else {
        lines.push(...dump.npcLines);
      }
      lines.push("SEQS");
      if (dump.seqLines.length === 0) {
        lines.push("(none)");
      } else {
        lines.push(...dump.seqLines);
      }
    } catch (e) {
      console.warn("anim log dump failed", e);
      lines.push("PLAYERS");
      lines.push("(none)");
      lines.push("NPCS");
      lines.push("(none)");
      lines.push("SEQS");
      lines.push("(none)");
    }
    lines.push("");
    return lines.join(`
`);
  }
  async titleScreenLoop() {
    if (this.loginscreen === 0) {
      let x = (this.sWid / 2 | 0) - 80;
      let y = (this.sHei / 2 | 0) + 20;
      y += 20;
      if (this.mouseClickButton === 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
        this.loginscreen = 3;
        this.loginSelect = 0;
      }
      x = (this.sWid / 2 | 0) + 80;
      if (this.mouseClickButton === 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
        this.loginMes1 = "";
        this.loginMes2 = "Enter your username & password.";
        this.loginscreen = 2;
        this.loginSelect = 0;
      }
    } else if (this.loginscreen === 2) {
      let y = (this.sHei / 2 | 0) - 40;
      y += 30;
      y += 25;
      if (this.mouseClickButton === 1 && this.mouseClickY >= y - 15 && this.mouseClickY < y) {
        this.loginSelect = 0;
      }
      y += 15;
      if (this.mouseClickButton === 1 && this.mouseClickY >= y - 15 && this.mouseClickY < y) {
        this.loginSelect = 1;
      }
      let x = (this.sWid / 2 | 0) - 80;
      y = (this.sHei / 2 | 0) + 50;
      y += 20;
      if (this.mouseClickButton === 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
        await this.login(this.loginUser, this.loginPass, false);
      }
      x = (this.sWid / 2 | 0) + 80;
      if (this.mouseClickButton === 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
        this.loginscreen = 0;
        this.loginUser = "";
        this.loginPass = "";
      }
      while (true) {
        const key = this.pollKey();
        if (key === -1) {
          return;
        }
        let valid = false;
        for (let i = 0;i < PixFont.CHARSET.length; i++) {
          if (String.fromCharCode(key) === PixFont.CHARSET.charAt(i)) {
            valid = true;
            break;
          }
        }
        if (this.loginSelect === 0) {
          if (key === 8 && this.loginUser.length > 0) {
            this.loginUser = this.loginUser.substring(0, this.loginUser.length - 1);
          }
          if (key === 9 || key === 10 || key === 13) {
            this.loginSelect = 1;
          }
          if (valid) {
            this.loginUser = this.loginUser + String.fromCharCode(key);
          }
          if (this.loginUser.length > 12) {
            this.loginUser = this.loginUser.substring(0, 12);
          }
        } else if (this.loginSelect === 1) {
          if (key === 8 && this.loginPass.length > 0) {
            this.loginPass = this.loginPass.substring(0, this.loginPass.length - 1);
          }
          if (key === 9 || key === 10 || key === 13) {
            this.loginSelect = 0;
          }
          if (valid) {
            this.loginPass = this.loginPass + String.fromCharCode(key);
          }
          if (this.loginPass.length > 20) {
            this.loginPass = this.loginPass.substring(0, 20);
          }
        }
      }
    } else if (this.loginscreen === 3) {
      const x = this.sWid / 2 | 0;
      let y = (this.sHei / 2 | 0) + 50;
      y += 20;
      if (this.mouseClickButton === 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
        this.loginscreen = 0;
      }
    }
  }
  async titleScreenDraw() {
    await this.prepareTitle();
    this.imageTitle4?.setPixels();
    this.imageTitlebox?.plotSprite(0, 0);
    const w = 360;
    const h = 200;
    if (this.loginscreen === 0) {
      let x = w / 2 | 0;
      let y = (h / 2 | 0) - 20;
      this.b12?.centreStringTag(x, y, "Welcome to RuneScape", 16776960 /* YELLOW */, true);
      x = (w / 2 | 0) - 80;
      y = (h / 2 | 0) + 20;
      this.imageTitlebutton?.plotSprite(x - 73, y - 20);
      this.b12?.centreStringTag(x, y + 5, "New user", 16777215 /* WHITE */, true);
      x = (w / 2 | 0) + 80;
      this.imageTitlebutton?.plotSprite(x - 73, y - 20);
      this.b12?.centreStringTag(x, y + 5, "Existing User", 16777215 /* WHITE */, true);
    } else if (this.loginscreen === 2) {
      let x = (w / 2 | 0) - 80;
      let y = (h / 2 | 0) - 40;
      if (this.loginMes1.length > 0) {
        this.b12?.centreStringTag(w / 2, y - 15, this.loginMes1, 16776960 /* YELLOW */, true);
        this.b12?.centreStringTag(w / 2, y, this.loginMes2, 16776960 /* YELLOW */, true);
        y += 30;
      } else {
        this.b12?.centreStringTag(w / 2, y - 7, this.loginMes2, 16776960 /* YELLOW */, true);
        y += 30;
      }
      this.b12?.drawStringTag(w / 2 - 90, y, `Username: ${this.loginUser}${this.loginSelect === 0 && this.loopCycle % 40 < 20 ? "@yel@|" : ""}`, 16777215 /* WHITE */, true);
      y += 15;
      this.b12?.drawStringTag(w / 2 - 88, y, `Password: ${JString.getRepeatedCharacter(this.loginPass)}${this.loginSelect === 1 && this.loopCycle % 40 < 20 ? "@yel@|" : ""}`, 16777215 /* WHITE */, true);
      y += 15;
      x = (w / 2 | 0) - 80;
      y = (h / 2 | 0) + 50;
      this.imageTitlebutton?.plotSprite(x - 73, y - 20);
      this.b12?.centreStringTag(x, y + 5, "Login", 16777215 /* WHITE */, true);
      x = (w / 2 | 0) + 80;
      this.imageTitlebutton?.plotSprite(x - 73, y - 20);
      this.b12?.centreStringTag(x, y + 5, "Cancel", 16777215 /* WHITE */, true);
    } else if (this.loginscreen === 3) {
      let x = w / 2 | 0;
      let y = (h / 2 | 0) - 60;
      this.b12?.centreStringTag(x, y, "Create a free account", 16776960 /* YELLOW */, true);
      y = (h / 2 | 0) - 35;
      this.b12?.centreStringTag(x, y, "To create a new account you need to", 16777215 /* WHITE */, true);
      y += 15;
      this.b12?.centreStringTag(x, y, "go back to the main RuneScape webpage", 16777215 /* WHITE */, true);
      y += 15;
      this.b12?.centreStringTag(x, y, "and choose the red 'create account'", 16777215 /* WHITE */, true);
      y += 15;
      this.b12?.centreStringTag(x, y, "button at the top right of that page.", 16777215 /* WHITE */, true);
      y += 15;
      x = w / 2 | 0;
      y = (h / 2 | 0) + 50;
      this.imageTitlebutton?.plotSprite(x - 73, y - 20);
      this.b12?.centreStringTag(x, y + 5, "Cancel", 16777215 /* WHITE */, true);
    }
    this.imageTitle4?.draw(214, 186);
    if (this.redrawFrame) {
      this.redrawFrame = false;
      this.imageTitle2?.draw(128, 0);
      this.imageTitle3?.draw(214, 386);
      this.imageTitle5?.draw(0, 265);
      this.imageTitle6?.draw(574, 265);
      this.imageTitle7?.draw(128, 186);
      this.imageTitle8?.draw(574, 186);
    }
  }
  async prepareTitle() {
    if (this.imageTitle2) {
      return;
    }
    this.drawArea = null;
    this.areaChatback = null;
    this.areaMapback = null;
    this.areaSidebar = null;
    this.areaViewport = null;
    this.areaBackbase1 = null;
    this.areaBackbase2 = null;
    this.areaBackhmid1 = null;
    this.imageTitle0 = new PixMap(128, 265);
    Pix2D.cls();
    this.imageTitle1 = new PixMap(128, 265);
    Pix2D.cls();
    this.imageTitle2 = new PixMap(533, 186);
    Pix2D.cls();
    this.imageTitle3 = new PixMap(360, 146);
    Pix2D.cls();
    this.imageTitle4 = new PixMap(360, 200);
    Pix2D.cls();
    this.imageTitle5 = new PixMap(214, 267);
    Pix2D.cls();
    this.imageTitle6 = new PixMap(215, 267);
    Pix2D.cls();
    this.imageTitle7 = new PixMap(86, 79);
    Pix2D.cls();
    this.imageTitle8 = new PixMap(87, 79);
    Pix2D.cls();
    if (this.title) {
      await this.loadTitleBackground();
      this.loadTitleImages();
    }
    this.redrawFrame = true;
  }
  async loadTitleBackground() {
    if (!this.title) {
      return;
    }
    const background = await Pix32.fromJpeg(this.title, "title.dat");
    this.imageTitle0?.setPixels();
    background.quickPlotSprite(0, 0);
    this.imageTitle1?.setPixels();
    background.quickPlotSprite(-661, 0);
    this.imageTitle2?.setPixels();
    background.quickPlotSprite(-128, 0);
    this.imageTitle3?.setPixels();
    background.quickPlotSprite(-214, -386);
    this.imageTitle4?.setPixels();
    background.quickPlotSprite(-214, -186);
    this.imageTitle5?.setPixels();
    background.quickPlotSprite(0, -265);
    this.imageTitle6?.setPixels();
    background.quickPlotSprite(-128, -186);
    this.imageTitle7?.setPixels();
    background.quickPlotSprite(-128, -186);
    this.imageTitle8?.setPixels();
    background.quickPlotSprite(-574, -186);
    background.hflip();
    this.imageTitle0?.setPixels();
    background.quickPlotSprite(394, 0);
    this.imageTitle1?.setPixels();
    background.quickPlotSprite(-267, 0);
    this.imageTitle2?.setPixels();
    background.quickPlotSprite(266, 0);
    this.imageTitle3?.setPixels();
    background.quickPlotSprite(180, -386);
    this.imageTitle4?.setPixels();
    background.quickPlotSprite(180, -186);
    this.imageTitle5?.setPixels();
    background.quickPlotSprite(394, -265);
    this.imageTitle6?.setPixels();
    background.quickPlotSprite(-180, -265);
    this.imageTitle7?.setPixels();
    background.quickPlotSprite(212, -186);
    this.imageTitle8?.setPixels();
    background.quickPlotSprite(-180, -186);
    const logo = Pix32.depack(this.title, "logo");
    this.imageTitle2?.setPixels();
    logo.plotSprite((this.sWid / 2 | 0) - (logo.wi / 2 | 0) - 128, 18);
  }
  loadTitleImages() {
    if (!this.title) {
      return;
    }
    this.imageTitlebox = Pix8.depack(this.title, "titlebox");
    this.imageTitlebutton = Pix8.depack(this.title, "titlebutton");
    for (let i = 0;i < 12; i++) {
      this.imageRunes[i] = Pix8.depack(this.title, "runes", i);
    }
    this.imageFlamesLeft = new Pix32(128, 265);
    this.imageFlamesRight = new Pix32(128, 265);
    if (this.imageTitle0)
      arraycopy(this.imageTitle0.data, 0, this.imageFlamesLeft.data, 0, 33920);
    if (this.imageTitle1)
      arraycopy(this.imageTitle1.data, 0, this.imageFlamesRight.data, 0, 33920);
    this.flameGradient0 = new Int32Array(256);
    for (let index = 0;index < 64; index++) {
      this.flameGradient0[index] = index * 262144;
    }
    for (let index = 0;index < 64; index++) {
      this.flameGradient0[index + 64] = index * 1024 + 16711680 /* RED */;
    }
    for (let index = 0;index < 64; index++) {
      this.flameGradient0[index + 128] = index * 4 + 16776960 /* YELLOW */;
    }
    for (let index = 0;index < 64; index++) {
      this.flameGradient0[index + 192] = 16777215 /* WHITE */;
    }
    this.flameGradient1 = new Int32Array(256);
    for (let index = 0;index < 64; index++) {
      this.flameGradient1[index] = index * 1024;
    }
    for (let index = 0;index < 64; index++) {
      this.flameGradient1[index + 64] = index * 4 + 65280 /* GREEN */;
    }
    for (let index = 0;index < 64; index++) {
      this.flameGradient1[index + 128] = index * 262144 + 65535 /* CYAN */;
    }
    for (let index = 0;index < 64; index++) {
      this.flameGradient1[index + 192] = 16777215 /* WHITE */;
    }
    this.flameGradient2 = new Int32Array(256);
    for (let index = 0;index < 64; index++) {
      this.flameGradient2[index] = index * 4;
    }
    for (let index = 0;index < 64; index++) {
      this.flameGradient2[index + 64] = index * 262144 + 255 /* BLUE */;
    }
    for (let index = 0;index < 64; index++) {
      this.flameGradient2[index + 128] = index * 1024 + 16711935 /* MAGENTA */;
    }
    for (let index = 0;index < 64; index++) {
      this.flameGradient2[index + 192] = 16777215 /* WHITE */;
    }
    this.flameGradient = new Int32Array(256);
    this.flameBuffer0 = new Int32Array(32768);
    this.flameBuffer1 = new Int32Array(32768);
    this.generateFlameCoolingMap(null);
    this.flameBuffer3 = new Int32Array(32768);
    this.flameBuffer2 = new Int32Array(32768);
    this.messageBox(10, "Connecting to fileserver").then(() => {
      if (!this.flameActive) {
        this.flameActive = true;
        this.flamesInterval = setInterval(this.renderFlames.bind(this), 35);
      }
    });
  }
  renderFlames() {
    if (!this.flameActive) {
      return;
    }
    this.updateFlames();
    this.updateFlames();
    this.drawFlames();
  }
  updateFlames() {
    if (!this.flameBuffer3 || !this.flameBuffer2 || !this.flameBuffer0 || !this.flameLineOffset) {
      return;
    }
    const height = 256;
    for (let x = 10;x < 117; x++) {
      const rand = Math.random() * 100 | 0;
      if (rand < 50)
        this.flameBuffer3[x + (height - 2 << 7)] = 255;
    }
    for (let l = 0;l < 100; l++) {
      const x = (Math.random() * 124 | 0) + 2;
      const y = (Math.random() * 128 | 0) + 128;
      const index = x + (y << 7);
      this.flameBuffer3[index] = 192;
    }
    for (let y = 1;y < height - 1; y++) {
      for (let x = 1;x < 127; x++) {
        const index = x + (y << 7);
        this.flameBuffer2[index] = (this.flameBuffer3[index - 1] + this.flameBuffer3[index + 1] + this.flameBuffer3[index - 128] + this.flameBuffer3[index + 128]) / 4 | 0;
      }
    }
    this.flameCycle0 += 128;
    if (this.flameCycle0 > this.flameBuffer0.length) {
      this.flameCycle0 -= this.flameBuffer0.length;
      this.generateFlameCoolingMap(this.imageRunes[Math.random() * 12 | 0]);
    }
    for (let y = 1;y < height - 1; y++) {
      for (let x = 1;x < 127; x++) {
        const index = x + (y << 7);
        let intensity = this.flameBuffer2[index + 128] - (this.flameBuffer0[index + this.flameCycle0 & this.flameBuffer0.length - 1] / 5 | 0);
        if (intensity < 0) {
          intensity = 0;
        }
        this.flameBuffer3[index] = intensity;
      }
    }
    for (let y = 0;y < height - 1; y++) {
      this.flameLineOffset[y] = this.flameLineOffset[y + 1];
    }
    this.flameLineOffset[height - 1] = Math.sin(this.loopCycle / 14) * 16 + Math.sin(this.loopCycle / 15) * 14 + Math.sin(this.loopCycle / 16) * 12 | 0;
    if (this.flameGradientCycle0 > 0) {
      this.flameGradientCycle0 -= 4;
    }
    if (this.flameGradientCycle1 > 0) {
      this.flameGradientCycle1 -= 4;
    }
    if (this.flameGradientCycle0 === 0 && this.flameGradientCycle1 === 0) {
      const rand = Math.random() * 2000 | 0;
      if (rand === 0) {
        this.flameGradientCycle0 = 1024;
      } else if (rand === 1) {
        this.flameGradientCycle1 = 1024;
      }
    }
  }
  generateFlameCoolingMap(image) {
    if (!this.flameBuffer0 || !this.flameBuffer1) {
      return;
    }
    const flameHeight = 256;
    this.flameBuffer0.fill(0);
    for (let i = 0;i < 5000; i++) {
      const rand = Math.random() * 128 * flameHeight | 0;
      this.flameBuffer0[rand] = Math.random() * 256 | 0;
    }
    for (let i = 0;i < 20; i++) {
      for (let y = 1;y < flameHeight - 1; y++) {
        for (let x = 1;x < 127; x++) {
          const index = x + (y << 7);
          this.flameBuffer1[index] = (this.flameBuffer0[index - 1] + this.flameBuffer0[index + 1] + this.flameBuffer0[index - 128] + this.flameBuffer0[index + 128]) / 4 | 0;
        }
      }
      const last = this.flameBuffer0;
      this.flameBuffer0 = this.flameBuffer1;
      this.flameBuffer1 = last;
    }
    if (image) {
      let off = 0;
      for (let y = 0;y < image.hi; y++) {
        for (let x = 0;x < image.wi; x++) {
          if (image.data[off++] !== 0) {
            const x0 = x + image.xof + 16;
            const y0 = y + image.yof + 16;
            const index = x0 + (y0 << 7);
            this.flameBuffer0[index] = 0;
          }
        }
      }
    }
  }
  drawFlames() {
    if (!this.flameGradient || !this.flameGradient0 || !this.flameGradient1 || !this.flameGradient2 || !this.flameLineOffset || !this.flameBuffer3) {
      return;
    }
    const height = 256;
    if (this.flameGradientCycle0 > 0) {
      for (let i = 0;i < 256; i++) {
        if (this.flameGradientCycle0 > 768) {
          this.flameGradient[i] = this.titleFlamesMerge(this.flameGradient0[i], 1024 - this.flameGradientCycle0, this.flameGradient1[i]);
        } else if (this.flameGradientCycle0 > 256) {
          this.flameGradient[i] = this.flameGradient1[i];
        } else {
          this.flameGradient[i] = this.titleFlamesMerge(this.flameGradient1[i], 256 - this.flameGradientCycle0, this.flameGradient0[i]);
        }
      }
    } else if (this.flameGradientCycle1 > 0) {
      for (let i = 0;i < 256; i++) {
        if (this.flameGradientCycle1 > 768) {
          this.flameGradient[i] = this.titleFlamesMerge(this.flameGradient0[i], 1024 - this.flameGradientCycle1, this.flameGradient2[i]);
        } else if (this.flameGradientCycle1 > 256) {
          this.flameGradient[i] = this.flameGradient2[i];
        } else {
          this.flameGradient[i] = this.titleFlamesMerge(this.flameGradient2[i], 256 - this.flameGradientCycle1, this.flameGradient0[i]);
        }
      }
    } else {
      for (let i = 0;i < 256; i++) {
        this.flameGradient[i] = this.flameGradient0[i];
      }
    }
    for (let i = 0;i < 33920; i++) {
      if (this.imageTitle0 && this.imageFlamesLeft)
        this.imageTitle0.data[i] = this.imageFlamesLeft.data[i];
    }
    let srcOffset = 0;
    let dstOffset = 1152;
    for (let y = 1;y < height - 1; y++) {
      const offset = this.flameLineOffset[y] * (height - y) / height | 0;
      let step = offset + 22;
      if (step < 0) {
        step = 0;
      }
      srcOffset += step;
      for (let x = step;x < 128; x++) {
        let value = this.flameBuffer3[srcOffset++];
        if (value === 0) {
          dstOffset++;
        } else {
          const alpha = value;
          const invAlpha = 256 - value;
          value = this.flameGradient[value];
          if (this.imageTitle0) {
            const background = this.imageTitle0.data[dstOffset];
            this.imageTitle0.data[dstOffset++] = ((value & 16711935) * alpha + (background & 16711935) * invAlpha & 4278255360) + ((value & 65280) * alpha + (background & 65280) * invAlpha & 16711680) >> 8;
          }
        }
      }
      dstOffset += step;
    }
    this.imageTitle0?.draw(0, 0);
    for (let i = 0;i < 33920; i++) {
      if (this.imageTitle1 && this.imageFlamesRight) {
        this.imageTitle1.data[i] = this.imageFlamesRight.data[i];
      }
    }
    srcOffset = 0;
    dstOffset = 1176;
    for (let y = 1;y < height - 1; y++) {
      const offset = this.flameLineOffset[y] * (height - y) / height | 0;
      const step = 103 - offset;
      dstOffset += offset;
      for (let x = 0;x < step; x++) {
        let value = this.flameBuffer3[srcOffset++];
        if (value === 0) {
          dstOffset++;
        } else {
          const alpha = value;
          const invAlpha = 256 - value;
          value = this.flameGradient[value];
          if (this.imageTitle1) {
            const background = this.imageTitle1.data[dstOffset];
            this.imageTitle1.data[dstOffset++] = ((value & 16711935) * alpha + (background & 16711935) * invAlpha & 4278255360) + ((value & 65280) * alpha + (background & 65280) * invAlpha & 16711680) >> 8;
          }
        }
      }
      srcOffset += 128 - step;
      dstOffset += 128 - step - offset;
    }
    this.imageTitle1?.draw(661, 0);
  }
  titleFlamesMerge(src, alpha, dst) {
    const invAlpha = 256 - alpha;
    return ((src & 16711935) * invAlpha + (dst & 16711935) * alpha & 4278255360) + ((src & 65280) * invAlpha + (dst & 65280) * alpha & 16711680) >> 8;
  }
  async login(username, password, reconnect) {
    try {
      if (!reconnect) {
        this.loginMes1 = "";
        this.loginMes2 = "Connecting to server...";
        await this.titleScreenDraw();
      }
      this.stream = new ClientStream(await ClientStream.openSocket(window.location.host, window.location.protocol === "https:"));
      await this.stream.readBytes(this.in.data, 0, 8);
      this.in.pos = 0;
      this.loginSeed = this.in.g8();
      const seed = new Int32Array([
        Math.floor(Math.random() * 99999999),
        Math.floor(Math.random() * 99999999),
        Number(this.loginSeed >> 32n),
        Number(this.loginSeed & BigInt(4294967295))
      ]);
      this.out.pos = 0;
      this.out.p1(10);
      this.out.p4(seed[0]);
      this.out.p4(seed[1]);
      this.out.p4(seed[2]);
      this.out.p4(seed[3]);
      this.out.p4(1337);
      this.out.pjstr(username);
      this.out.pjstr(password);
      this.out.rsaenc(BigInt("7162900525229798032761816791230527296329313291232324290237849263501208207972894053929065636522363163621000728841182238772712427862772219676577293600221789"), BigInt("58778699976184461502525193738213253649000149147835990136706041084440742975821"));
      this.loginout.pos = 0;
      if (reconnect) {
        this.loginout.p1(18);
      } else {
        this.loginout.p1(16);
      }
      this.loginout.p1(this.out.pos + 36 + 1 + 1);
      this.loginout.p1(CLIENT_VERSION);
      this.loginout.p1(Client.lowMem ? 1 : 0);
      for (let i = 0;i < 9; i++) {
        this.loginout.p4(this.jagChecksum[i]);
      }
      this.loginout.pdata(this.out.data, this.out.pos, 0);
      this.out.random = new Isaac(seed);
      for (let i = 0;i < 4; i++) {
        seed[i] += 50;
      }
      this.randomIn = new Isaac(seed);
      this.stream?.write(this.loginout.data, this.loginout.pos);
      const response = await this.stream.read();
      if (response === 1) {
        await sleep(2000);
        await this.login(username, password, reconnect);
      } else if (response === 2 || response === 18) {
        this.staffmod = response === 18;
        InputTracking.setDisabled();
        this.ingame = true;
        this.out.pos = 0;
        this.in.pos = 0;
        this.ptype = -1;
        this.ptype0 = -1;
        this.ptype1 = -1;
        this.ptype2 = -1;
        this.psize = 0;
        this.timeoutTimer = performance.now();
        this.rebootTimer = 0;
        this.logoutTimer = 0;
        this.hintType = 0;
        this.menuNumEntries = 0;
        this.isMenuOpen = false;
        this.idleTimer = performance.now();
        for (let i = 0;i < 100; i++) {
          this.chatText[i] = null;
        }
        this.useMode = 0;
        this.targetMode = 0;
        this.sceneState = 0;
        this.waveCount = 0;
        this.macroCameraX = (Math.random() * 100 | 0) - 50;
        this.macroCameraZ = (Math.random() * 110 | 0) - 55;
        this.macroCameraAngle = (Math.random() * 80 | 0) - 40;
        this.macroMinimapAngle = (Math.random() * 120 | 0) - 60;
        this.macroMinimapZoom = (Math.random() * 30 | 0) - 20;
        this.orbitCameraYaw = (Math.random() * 20 | 0) - 10 & 2047;
        this.minimapLevel = -1;
        this.minimapFlagX = 0;
        this.minimapFlagZ = 0;
        this.playerCount = 0;
        this.npcCount = 0;
        for (let i = 0;i < MAX_PLAYER_COUNT; i++) {
          this.players[i] = null;
          this.playerAppearanceBuffer[i] = null;
        }
        for (let i = 0;i < 8192; i++) {
          this.npc[i] = null;
        }
        this.localPlayer = this.players[LOCAL_PLAYER_INDEX] = new ClientPlayer;
        this.projectiles.clear();
        this.spotanims.clear();
        for (let level = 0;level < 4 /* LEVELS */; level++) {
          for (let x = 0;x < 104 /* SIZE */; x++) {
            for (let z = 0;z < 104 /* SIZE */; z++) {
              this.groundObj[level][x][z] = null;
            }
          }
        }
        this.locChanges = new LinkList;
        this.friendCount = 0;
        this.tutComId = -1;
        this.chatComId = -1;
        this.mainModalId = -1;
        this.sideModalId = -1;
        this.resumedPauseButton = false;
        this.sideTab = 3;
        this.dialogInputOpen = false;
        this.isMenuOpen = false;
        this.socialInputOpen = false;
        this.tutComMessage = null;
        this.inMultizone = 0;
        this.tutFlashingTab = -1;
        this.idkDesignGender = true;
        this.validateIdkDesign();
        for (let i = 0;i < 5; i++) {
          this.idkDesignColour[i] = 0;
        }
        Client.oplogic1 = 0;
        Client.oplogic2 = 0;
        Client.oplogic3 = 0;
        Client.oplogic4 = 0;
        Client.oplogic5 = 0;
        Client.oplogic6 = 0;
        Client.oplogic7 = 0;
        Client.oplogic8 = 0;
        Client.oplogic9 = 0;
        Client.oplogic10 = 0;
        this.prepareGame();
      } else if (response === 3) {
        this.loginMes1 = "";
        this.loginMes2 = "Invalid username or password.";
      } else if (response === 4) {
        this.loginMes1 = "Your account has been disabled.";
        this.loginMes2 = "Please check your message-centre for details.";
      } else if (response === 5) {
        this.loginMes1 = "Your account is already logged in.";
        this.loginMes2 = "Try again in 60 secs...";
      } else if (response === 6) {
        this.loginMes1 = "RuneScape has been updated!";
        this.loginMes2 = "Please reload this page.";
      } else if (response === 7) {
        this.loginMes1 = "This world is full.";
        this.loginMes2 = "Please use a different world.";
      } else if (response === 8) {
        this.loginMes1 = "Unable to connect.";
        this.loginMes2 = "Login server offline.";
      } else if (response === 9) {
        this.loginMes1 = "Login limit exceeded.";
        this.loginMes2 = "Too many connections from your address.";
      } else if (response === 10) {
        this.loginMes1 = "Unable to connect.";
        this.loginMes2 = "Bad session id.";
      } else if (response === 11) {
        this.loginMes2 = "Login server rejected session.";
        this.loginMes2 = "Please try again.";
      } else if (response === 12) {
        this.loginMes1 = "You need a members account to login to this world.";
        this.loginMes2 = "Please subscribe, or use a different world.";
      } else if (response === 13) {
        this.loginMes1 = "Could not complete login.";
        this.loginMes2 = "Please try using a different world.";
      } else if (response === 14) {
        this.loginMes1 = "The server is being updated.";
        this.loginMes2 = "Please wait 1 minute and try again.";
      } else if (response === 15) {
        this.ingame = true;
        this.out.pos = 0;
        this.in.pos = 0;
        this.ptype = -1;
        this.ptype0 = -1;
        this.ptype1 = -1;
        this.ptype2 = -1;
        this.psize = 0;
        this.timeoutTimer = performance.now();
        this.rebootTimer = 0;
        this.menuNumEntries = 0;
        this.isMenuOpen = false;
      } else if (response === 16) {
        this.loginMes1 = "Login attempts exceeded.";
        this.loginMes2 = "Please wait 1 minute and try again.";
      } else if (response === 17) {
        this.loginMes1 = "You are standing in a members-only area.";
        this.loginMes2 = "To play on this world move to a free area first";
      }
    } catch (e) {
      if (e instanceof WebSocket && e.readyState === 3) {
        this.loginMes1 = "";
        this.loginMes2 = "Error connecting to server.";
      } else {
        throw e;
      }
    }
  }
  unloadTitle() {
    this.flameActive = false;
    if (this.flamesInterval) {
      clearInterval(this.flamesInterval);
      this.flamesInterval = null;
    }
    this.imageTitlebox = null;
    this.imageTitlebutton = null;
    this.imageRunes = [];
    this.flameGradient = null;
    this.flameGradient0 = null;
    this.flameGradient1 = null;
    this.flameGradient2 = null;
    this.flameBuffer0 = null;
    this.flameBuffer1 = null;
    this.flameBuffer3 = null;
    this.flameBuffer2 = null;
    this.imageFlamesLeft = null;
    this.imageFlamesRight = null;
  }
  prepareGame() {
    if (this.areaChatback) {
      return;
    }
    this.unloadTitle();
    this.drawArea = null;
    this.imageTitle2 = null;
    this.imageTitle3 = null;
    this.imageTitle4 = null;
    this.imageTitle0 = null;
    this.imageTitle1 = null;
    this.imageTitle5 = null;
    this.imageTitle6 = null;
    this.imageTitle7 = null;
    this.imageTitle8 = null;
    this.areaChatback = new PixMap(479, 96);
    this.areaMapback = new PixMap(168, 160);
    Pix2D.cls();
    this.mapback?.plotSprite(0, 0);
    this.areaSidebar = new PixMap(190, 261);
    this.areaViewport = new PixMap(512, 334);
    Pix2D.cls();
    this.areaBackbase1 = new PixMap(501, 61);
    this.areaBackbase2 = new PixMap(288, 40);
    this.areaBackhmid1 = new PixMap(269, 66);
    this.redrawFrame = true;
  }
  async gameLoop() {
    if (this.players === null) {
      return;
    }
    if (this.rebootTimer > 1) {
      this.rebootTimer--;
    }
    if (this.logoutTimer > 0) {
      this.logoutTimer--;
    }
    for (let i = 0;i < 5 && await this.tcpIn(); i++) {}
    const now = performance.now();
    if (!this.ingame) {
      return;
    }
    this.checkMinimap();
    this.locChangeDoQueue();
    await this.soundsDoQueue();
    const tracking = InputTracking.flush();
    if (tracking) {
      this.out.p1Enc(81 /* EVENT_TRACKING */);
      this.out.p2(tracking.pos);
      this.out.pdata(tracking.data, tracking.pos, 0);
      tracking.release();
    }
    if (now - this.timeoutTimer > 15000) {
      await this.lostCon();
    }
    this.movePlayers();
    this.moveNpcs();
    this.timeoutChat();
    if ((this.keyHeld[1] === 1 || this.keyHeld[2] === 1 || this.keyHeld[3] === 1 || this.keyHeld[4] === 1) && this.cameraMovedWrite++ > 5) {
      this.cameraMovedWrite = 0;
      this.out.p1Enc(189 /* EVENT_CAMERA_POSITION */);
      this.out.p2(this.orbitCameraPitch);
      this.out.p2(this.orbitCameraYaw);
      this.out.p1(this.macroMinimapAngle);
      this.out.p1(this.macroMinimapZoom);
    }
    this.worldUpdateNum++;
    if (this.crossMode !== 0) {
      this.crossCycle += 20;
      if (this.crossCycle >= 400) {
        this.crossMode = 0;
      }
    }
    if (this.selectedArea !== 0) {
      this.selectedCycle++;
      if (this.selectedCycle >= 15) {
        if (this.selectedArea === 2) {
          this.redrawSidebar = true;
        }
        if (this.selectedArea === 3) {
          this.redrawChatback = true;
        }
        this.selectedArea = 0;
      }
    }
    if (this.objDragArea !== 0) {
      this.objDragCycles++;
      if (this.mouseX > this.objGrabX + 5 || this.mouseX < this.objGrabX - 5 || this.mouseY > this.objGrabY + 5 || this.mouseY < this.objGrabY - 5) {
        this.objGrabThreshold = true;
      }
      if (this.mouseButton === 0) {
        if (this.objDragArea === 2) {
          this.redrawSidebar = true;
        }
        if (this.objDragArea === 3) {
          this.redrawChatback = true;
        }
        this.objDragArea = 0;
        if (this.objGrabThreshold && this.objDragCycles >= 5) {
          this.hoveredSlotComId = -1;
          this.buildMinimenu();
          if (this.hoveredSlotComId === this.objDragComId && this.hoveredSlot !== this.objDragSlot) {
            const com = IfType.list[this.objDragComId];
            if (com.linkObjType) {
              const obj = com.linkObjType[this.hoveredSlot];
              com.linkObjType[this.hoveredSlot] = com.linkObjType[this.objDragSlot];
              com.linkObjType[this.objDragSlot] = obj;
            }
            if (com.linkObjNumber) {
              const count = com.linkObjNumber[this.hoveredSlot];
              com.linkObjNumber[this.hoveredSlot] = com.linkObjNumber[this.objDragSlot];
              com.linkObjNumber[this.objDragSlot] = count;
            }
            this.out.p1Enc(159 /* INV_BUTTOND */);
            this.out.p2(this.objDragComId);
            this.out.p2(this.objDragSlot);
            this.out.p2(this.hoveredSlot);
          }
        } else if ((this.oneMouseButton === 1 || this.isAddFriendOption(this.menuNumEntries - 1)) && this.menuNumEntries > 2) {
          this.openMenu();
        } else if (this.menuNumEntries > 0) {
          await this.doAction(this.menuNumEntries - 1);
        }
        this.selectedCycle = 10;
        this.mouseClickButton = 0;
      }
    }
    Client.cyclelogic3++;
    if (Client.cyclelogic3 > 127) {
      Client.cyclelogic3 = 0;
      this.out.p1Enc(215 /* ANTICHEAT_CYCLELOGIC3 */);
      this.out.p3(4991788);
    }
    if (World.groundX !== -1) {
      if (this.localPlayer) {
        const x = World.groundX;
        const z = World.groundZ;
        const success = this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], x, z, 0, 0, 0, 0, 0, 0, true);
        World.groundX = -1;
        if (success) {
          this.crossX = this.mouseClickX;
          this.crossY = this.mouseClickY;
          this.crossMode = 1;
          this.crossCycle = 0;
        }
      }
    }
    if (this.mouseClickButton === 1 && this.tutComMessage) {
      this.tutComMessage = null;
      this.redrawChatback = true;
      this.mouseClickButton = 0;
    }
    const checkClickInput = !this.isMobile || this.isMobile && !MobileKeyboard_default.isWithinCanvasKeyboard(this.mouseClickX, this.mouseClickY);
    if (checkClickInput) {
      this.mouseLoop();
      this.minimapLoop();
      this.tabLoop();
      this.chatModeLoop();
    }
    if (this.mouseButton === 1 || this.mouseClickButton === 1) {
      this.scrollCycle++;
    }
    if (this.sceneState === 2) {
      this.followCamera();
    }
    if (this.sceneState === 2 && this.cinemaCam) {
      this.cinemaCamera();
    }
    for (let i = 0;i < 5; i++) {
      this.camShakeCycle[i]++;
    }
    await this.handleInputKey();
    if (now - this.idleTimer > 90000) {
      this.logoutTimer = 250;
      this.idleTimer += 1e4;
      this.out.p1Enc(70 /* IDLE_TIMER */);
    }
    this.macroCameraCycle++;
    if (this.macroCameraCycle > 500) {
      this.macroCameraCycle = 0;
      const rand = Math.random() * 8 | 0;
      if ((rand & 1) === 1) {
        this.macroCameraX += this.macroCameraXModifier;
      }
      if ((rand & 2) === 2) {
        this.macroCameraZ += this.macroCameraZModifier;
      }
      if ((rand & 4) === 4) {
        this.macroCameraAngle += this.macroCameraAngleModifier;
      }
    }
    if (this.macroCameraX < -50) {
      this.macroCameraXModifier = 2;
    }
    if (this.macroCameraX > 50) {
      this.macroCameraXModifier = -2;
    }
    if (this.macroCameraZ < -55) {
      this.macroCameraZModifier = 2;
    }
    if (this.macroCameraZ > 55) {
      this.macroCameraZModifier = -2;
    }
    if (this.macroCameraAngle < -40) {
      this.macroCameraAngleModifier = 1;
    }
    if (this.macroCameraAngle > 40) {
      this.macroCameraAngleModifier = -1;
    }
    this.macroMinimapCycle++;
    if (this.macroMinimapCycle > 500) {
      this.macroMinimapCycle = 0;
      const rand = Math.random() * 8 | 0;
      if ((rand & 1) === 1) {
        this.macroMinimapAngle += this.macroMinimapAngleModifier;
      }
      if ((rand & 2) === 2) {
        this.macroMinimapZoom += this.macroMinimapZoomModifier;
      }
    }
    if (this.macroMinimapAngle < -60) {
      this.macroMinimapAngleModifier = 2;
    }
    if (this.macroMinimapAngle > 60) {
      this.macroMinimapAngleModifier = -2;
    }
    if (this.macroMinimapZoom < -20) {
      this.macroMinimapZoomModifier = 1;
    }
    if (this.macroMinimapZoom > 10) {
      this.macroMinimapZoomModifier = -1;
    }
    Client.cyclelogic4++;
    if (Client.cyclelogic4 > 110) {
      Client.cyclelogic4 = 0;
      this.out.p1Enc(236 /* ANTICHEAT_CYCLELOGIC4 */);
      this.out.p4(0);
    }
    if (now - this.noTimeoutTimer > 1000) {
      this.out.p1Enc(108 /* NO_TIMEOUT */);
    }
    try {
      if (this.stream && this.out.pos > 0) {
        this.stream.write(this.out.data, this.out.pos);
        this.out.pos = 0;
        this.noTimeoutTimer = now;
      }
    } catch (e) {
      if (e instanceof WebSocket && e.readyState === 3) {
        await this.lostCon();
      } else {
        await this.logout();
      }
    }
    this.refNeedCapture = RefCapture.on;
    if (RefAnimLog.on && this.localPlayer) {
      RefAnimLog.logTick(this.loopCycle, this.buildAnimLogDump());
    }
  }
  async logout() {
    if (this.stream) {
      this.stream.close();
    }
    this.stream = null;
    this.ingame = false;
    this.loginscreen = 0;
    this.loginUser = "";
    this.loginPass = "";
    InputTracking.setDisabled();
    this.clearCaches();
    this.world?.resetMap();
    for (let level = 0;level < 4 /* LEVELS */; level++) {
      this.collision[level]?.reset();
    }
    stopMidi(false);
    this.midiSong = null;
    this.nextMusicDelay = 0;
  }
  clearCaches() {
    LocType.mc1?.clear();
    LocType.mc2?.clear();
    NpcType.modelCache?.clear();
    ObjType.modelCache?.clear();
    ObjType.spriteCache?.clear();
    ClientPlayer.modelCache?.clear();
    SpotType.modelCache?.clear();
  }
  async lostCon() {
    console.trace("lostcon");
    if (this.logoutTimer > 0) {
      await this.logout();
      return;
    }
    this.areaViewport?.setPixels();
    this.p12?.centreString(257, 144, "Connection lost", 0 /* BLACK */);
    this.p12?.centreString(256, 143, "Connection lost", 16777215 /* WHITE */);
    this.p12?.centreString(257, 159, "Please wait - attempting to reestablish", 0 /* BLACK */);
    this.p12?.centreString(256, 158, "Please wait - attempting to reestablish", 16777215 /* WHITE */);
    this.areaViewport?.draw(8, 11);
    this.minimapFlagX = 0;
    this.stream?.close();
    this.ingame = false;
    await this.login(this.loginUser, this.loginPass, true);
    if (!this.ingame) {
      await this.logout();
    }
  }
  buildMinimenu() {
    if (this.objDragArea !== 0) {
      return;
    }
    this.menuOption[0] = "Cancel";
    this.menuAction[0] = 1252;
    this.menuNumEntries = 1;
    this.addPrivateChatOptions();
    this.lastOverComId = 0;
    if (this.mouseX > 8 && this.mouseY > 11 && this.mouseX < 520 && this.mouseY < 345) {
      if (this.mainModalId === -1) {
        this.addWorldOptions();
      } else {
        this.addComponentOptions(IfType.list[this.mainModalId], this.mouseX, this.mouseY, 8, 11, 0);
      }
    }
    if (this.lastOverComId !== this.overMainComId) {
      this.overMainComId = this.lastOverComId;
    }
    this.lastOverComId = 0;
    if (this.mouseX > 562 && this.mouseY > 231 && this.mouseX < 752 && this.mouseY < 492) {
      if (this.sideModalId !== -1) {
        this.addComponentOptions(IfType.list[this.sideModalId], this.mouseX, this.mouseY, 562, 231, 0);
      } else if (this.sideOverlayId[this.sideTab] !== -1) {
        this.addComponentOptions(IfType.list[this.sideOverlayId[this.sideTab]], this.mouseX, this.mouseY, 562, 231, 0);
      }
    }
    if (this.lastOverComId !== this.overSideComId) {
      this.redrawSidebar = true;
      this.overSideComId = this.lastOverComId;
    }
    this.lastOverComId = 0;
    if (this.mouseX > 22 && this.mouseY > 375 && this.mouseX < 431 && this.mouseY < 471) {
      if (this.chatComId !== -1) {
        this.addComponentOptions(IfType.list[this.chatComId], this.mouseX, this.mouseY, 22, 375, 0);
      } else {
        this.addChatOptions(this.mouseX - 22, this.mouseY - 375);
      }
    }
    if (this.chatComId !== -1 && this.lastOverComId !== this.overChatComId) {
      this.redrawChatback = true;
      this.overChatComId = this.lastOverComId;
    }
    let sorted = false;
    while (!sorted) {
      sorted = true;
      for (let i = 0;i < this.menuNumEntries - 1; i++) {
        if (this.menuAction[i] < 1000 && this.menuAction[i + 1] > 1000) {
          const tmp0 = this.menuOption[i];
          this.menuOption[i] = this.menuOption[i + 1];
          this.menuOption[i + 1] = tmp0;
          const tmp1 = this.menuAction[i];
          this.menuAction[i] = this.menuAction[i + 1];
          this.menuAction[i + 1] = tmp1;
          const tmp2 = this.menuParamB[i];
          this.menuParamB[i] = this.menuParamB[i + 1];
          this.menuParamB[i + 1] = tmp2;
          const tmp3 = this.menuParamC[i];
          this.menuParamC[i] = this.menuParamC[i + 1];
          this.menuParamC[i + 1] = tmp3;
          const tmp4 = this.menuParamA[i];
          this.menuParamA[i] = this.menuParamA[i + 1];
          this.menuParamA[i + 1] = tmp4;
          sorted = false;
        }
      }
    }
  }
  addPrivateChatOptions() {
    if (this.splitPrivateChat === 0) {
      return;
    }
    let line = 0;
    if (this.rebootTimer !== 0) {
      line = 1;
    }
    for (let i = 0;i < 100; i++) {
      if (this.chatText[i] !== null) {
        const type = this.chatType[i];
        if ((type === 3 || type === 7) && (type === 7 || this.chatPrivateMode === 0 || this.chatPrivateMode === 1 && this.isFriend(this.chatUsername[i]))) {
          const y = 329 - line * 13;
          if (this.mouseX > 8 && this.mouseX < 520 && this.mouseY - 11 > y - 10 && this.mouseY - 11 <= y + 3) {
            if (this.staffmod) {
              this.menuOption[this.menuNumEntries] = "Report abuse @whi@" + this.chatUsername[i];
              this.menuAction[this.menuNumEntries] = 2034;
              this.menuNumEntries++;
            }
            this.menuOption[this.menuNumEntries] = "Add ignore @whi@" + this.chatUsername[i];
            this.menuAction[this.menuNumEntries] = 2436;
            this.menuNumEntries++;
            this.menuOption[this.menuNumEntries] = "Add friend @whi@" + this.chatUsername[i];
            this.menuAction[this.menuNumEntries] = 2406;
            this.menuNumEntries++;
          }
          line++;
          if (line >= 5) {
            return;
          }
        } else if ((type === 5 || type === 6) && this.chatPrivateMode < 2) {
          line++;
          if (line >= 5) {
            return;
          }
        }
      }
    }
  }
  addChatOptions(_mouseX, mouseY) {
    let line = 0;
    for (let i = 0;i < 100; i++) {
      if (!this.chatText[i]) {
        continue;
      }
      const type = this.chatType[i];
      const y = this.chatScrollPos + 70 + 4 - line * 14;
      if (y < -20) {
        break;
      }
      if (type === 0) {
        line++;
      } else if ((type == 1 || type == 2) && (type == 1 || this.chatPublicMode == 0 || this.chatPublicMode === 1 && this.isFriend(this.chatUsername[i]))) {
        if (mouseY > y - 14 && mouseY <= y && this.localPlayer && this.chatUsername[i] !== this.localPlayer.name) {
          if (this.staffmod) {
            this.menuOption[this.menuNumEntries] = "Report abuse @whi@" + this.chatUsername[i];
            this.menuAction[this.menuNumEntries] = 34;
            this.menuNumEntries++;
          }
          this.menuOption[this.menuNumEntries] = "Add ignore @whi@" + this.chatUsername[i];
          this.menuAction[this.menuNumEntries] = 436;
          this.menuNumEntries++;
          this.menuOption[this.menuNumEntries] = "Add friend @whi@" + this.chatUsername[i];
          this.menuAction[this.menuNumEntries] = 406;
          this.menuNumEntries++;
        }
        line++;
      } else if ((type === 3 || type === 7) && this.splitPrivateChat === 0 && (type === 7 || this.chatPrivateMode === 0 || this.chatPrivateMode === 1 && this.isFriend(this.chatUsername[i]))) {
        if (mouseY > y - 14 && mouseY <= y) {
          if (this.staffmod) {
            this.menuOption[this.menuNumEntries] = "Report abuse @whi@" + this.chatUsername[i];
            this.menuAction[this.menuNumEntries] = 34;
            this.menuNumEntries++;
          }
          this.menuOption[this.menuNumEntries] = "Add ignore @whi@" + this.chatUsername[i];
          this.menuAction[this.menuNumEntries] = 436;
          this.menuNumEntries++;
          this.menuOption[this.menuNumEntries] = "Add friend @whi@" + this.chatUsername[i];
          this.menuAction[this.menuNumEntries] = 406;
          this.menuNumEntries++;
        }
        line++;
      } else if (type === 4 && (this.chatTradeMode === 0 || this.chatTradeMode === 1 && this.isFriend(this.chatUsername[i]))) {
        if (mouseY > y - 14 && mouseY <= y) {
          this.menuOption[this.menuNumEntries] = "Accept trade @whi@" + this.chatUsername[i];
          this.menuAction[this.menuNumEntries] = 903;
          this.menuNumEntries++;
        }
        line++;
      } else if ((type === 5 || type === 6) && this.splitPrivateChat === 0 && this.chatPrivateMode < 2) {
        line++;
      } else if (type === 8 && (this.chatTradeMode === 0 || this.chatTradeMode === 1 && this.isFriend(this.chatUsername[i]))) {
        if (mouseY > y - 14 && mouseY <= y) {
          this.menuOption[this.menuNumEntries] = "Accept duel @whi@" + this.chatUsername[i];
          this.menuAction[this.menuNumEntries] = 363;
          this.menuNumEntries++;
        }
        line++;
      }
    }
  }
  minimapLoop() {
    if (this.mouseClickButton !== 1 || !this.localPlayer) {
      return;
    }
    let x = this.mouseClickX - 21 - 561;
    let y = this.mouseClickY - 9 - 5;
    if (x < 0 || y < 0 || x >= 146 || y >= 151) {
      return;
    }
    x -= 73;
    y -= 75;
    const yaw = this.orbitCameraYaw + this.macroMinimapAngle & 2047;
    let sinYaw = Pix3D.sinTable[yaw];
    let cosYaw = Pix3D.cosTable[yaw];
    sinYaw = sinYaw * (this.macroMinimapZoom + 256) >> 8;
    cosYaw = cosYaw * (this.macroMinimapZoom + 256) >> 8;
    const relX = y * sinYaw + x * cosYaw >> 11;
    const relY = y * cosYaw - x * sinYaw >> 11;
    const tileX = this.localPlayer.x + relX >> 7;
    const tileZ = this.localPlayer.z - relY >> 7;
    if (this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], tileX, tileZ, 1, 0, 0, 0, 0, 0, true)) {
      this.out.p1(x);
      this.out.p1(y);
      this.out.p2(this.orbitCameraYaw);
      this.out.p1(57);
      this.out.p1(this.macroMinimapAngle);
      this.out.p1(this.macroMinimapZoom);
      this.out.p1(89);
      this.out.p2(this.localPlayer.x);
      this.out.p2(this.localPlayer.z);
      this.out.p1(this.tryMoveNearest);
      this.out.p1(63);
    }
  }
  tabLoop() {
    if (this.mouseClickButton !== 1) {
      return;
    }
    if (this.mouseClickX >= 549 && this.mouseClickX <= 583 && this.mouseClickY >= 195 && this.mouseClickY < 231 && this.sideOverlayId[0] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 0;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 579 && this.mouseClickX <= 609 && this.mouseClickY >= 194 && this.mouseClickY < 231 && this.sideOverlayId[1] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 1;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 607 && this.mouseClickX <= 637 && this.mouseClickY >= 194 && this.mouseClickY < 231 && this.sideOverlayId[2] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 2;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 635 && this.mouseClickX <= 679 && this.mouseClickY >= 194 && this.mouseClickY < 229 && this.sideOverlayId[3] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 3;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 676 && this.mouseClickX <= 706 && this.mouseClickY >= 194 && this.mouseClickY < 231 && this.sideOverlayId[4] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 4;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 704 && this.mouseClickX <= 734 && this.mouseClickY >= 194 && this.mouseClickY < 231 && this.sideOverlayId[5] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 5;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 732 && this.mouseClickX <= 766 && this.mouseClickY >= 195 && this.mouseClickY < 231 && this.sideOverlayId[6] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 6;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 550 && this.mouseClickX <= 584 && this.mouseClickY >= 492 && this.mouseClickY < 528 && this.sideOverlayId[7] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 7;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 582 && this.mouseClickX <= 612 && this.mouseClickY >= 492 && this.mouseClickY < 529 && this.sideOverlayId[8] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 8;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 609 && this.mouseClickX <= 639 && this.mouseClickY >= 492 && this.mouseClickY < 529 && this.sideOverlayId[9] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 9;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 637 && this.mouseClickX <= 681 && this.mouseClickY >= 493 && this.mouseClickY < 528 && this.sideOverlayId[10] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 10;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 679 && this.mouseClickX <= 709 && this.mouseClickY >= 492 && this.mouseClickY < 529 && this.sideOverlayId[11] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 11;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 706 && this.mouseClickX <= 736 && this.mouseClickY >= 492 && this.mouseClickY < 529 && this.sideOverlayId[12] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 12;
      this.redrawSideicons = true;
    } else if (this.mouseClickX >= 734 && this.mouseClickX <= 768 && this.mouseClickY >= 492 && this.mouseClickY < 528 && this.sideOverlayId[13] !== -1) {
      this.redrawSidebar = true;
      this.sideTab = 13;
      this.redrawSideicons = true;
    }
    Client.cyclelogic1++;
    if (Client.cyclelogic1 > 150) {
      Client.cyclelogic1 = 0;
      this.out.p1Enc(233 /* ANTICHEAT_CYCLELOGIC1 */);
      this.out.p1(43);
    }
  }
  chatModeLoop() {
    if (this.mouseClickButton !== 1) {
      return;
    }
    if (this.mouseClickX >= 8 && this.mouseClickX <= 108 && this.mouseClickY >= 490 && this.mouseClickY <= 522) {
      this.chatPublicMode = (this.chatPublicMode + 1) % 4;
      this.redrawPrivacySettings = true;
      this.redrawChatback = true;
      this.out.p1Enc(244 /* CHAT_SETMODE */);
      this.out.p1(this.chatPublicMode);
      this.out.p1(this.chatPrivateMode);
      this.out.p1(this.chatTradeMode);
    } else if (this.mouseClickX >= 137 && this.mouseClickX <= 237 && this.mouseClickY >= 490 && this.mouseClickY <= 522) {
      this.chatPrivateMode = (this.chatPrivateMode + 1) % 3;
      this.redrawPrivacySettings = true;
      this.redrawChatback = true;
      this.out.p1Enc(244 /* CHAT_SETMODE */);
      this.out.p1(this.chatPublicMode);
      this.out.p1(this.chatPrivateMode);
      this.out.p1(this.chatTradeMode);
    } else if (this.mouseClickX >= 275 && this.mouseClickX <= 375 && this.mouseClickY >= 490 && this.mouseClickY <= 522) {
      this.chatTradeMode = (this.chatTradeMode + 1) % 3;
      this.redrawPrivacySettings = true;
      this.redrawChatback = true;
      this.out.p1Enc(244 /* CHAT_SETMODE */);
      this.out.p1(this.chatPublicMode);
      this.out.p1(this.chatPrivateMode);
      this.out.p1(this.chatTradeMode);
    } else if (this.mouseClickX >= 416 && this.mouseClickX <= 516 && this.mouseClickY >= 490 && this.mouseClickY <= 522) {
      this.closeModal();
      this.reportAbuseInput = "";
      this.reportAbuseMuteOption = false;
      for (let i = 0;i < IfType.list.length; i++) {
        if (IfType.list[i] && IfType.list[i].clientCode === 600) {
          this.reportAbuseComId = this.mainModalId = IfType.list[i].layerId;
          break;
        }
      }
      if (this.isMobile) {
        MobileKeyboard_default.show();
      }
    }
  }
  timeoutChat() {
    for (let i = -1;i < this.playerCount; i++) {
      let index;
      if (i === -1) {
        index = LOCAL_PLAYER_INDEX;
      } else {
        index = this.playerIds[i];
      }
      const player = this.players[index];
      if (player && player.chatTimer > 0) {
        player.chatTimer--;
        if (player.chatTimer === 0) {
          player.chatMessage = null;
        }
      }
    }
    for (let i = 0;i < this.npcCount; i++) {
      const index = this.npcIds[i];
      const npc = this.npc[index];
      if (npc && npc.chatTimer > 0) {
        npc.chatTimer--;
        if (npc.chatTimer === 0) {
          npc.chatMessage = null;
        }
      }
    }
  }
  async handleInputKey() {
    while (true) {
      let key;
      do {
        while (true) {
          key = this.pollKey();
          if (key === -1) {
            return;
          }
          if (this.mainModalId !== -1 && this.mainModalId === this.reportAbuseComId) {
            if (key === 8 && this.reportAbuseInput.length > 0) {
              this.reportAbuseInput = this.reportAbuseInput.substring(0, this.reportAbuseInput.length - 1);
            }
            break;
          }
          if (this.socialInputOpen) {
            if (key >= 32 && key <= 122 && this.socialInput.length < 80) {
              this.socialInput = this.socialInput + String.fromCharCode(key);
              this.redrawChatback = true;
            }
            if (key === 8 && this.socialInput.length > 0) {
              this.socialInput = this.socialInput.substring(0, this.socialInput.length - 1);
              this.redrawChatback = true;
            }
            if (key === 13 || key === 10) {
              this.socialInputOpen = false;
              this.redrawChatback = true;
              let userhash;
              if (this.socialInputType === 1) {
                userhash = JString.toUserhash(this.socialInput);
                this.addFriend(userhash);
              }
              if (this.socialInputType === 2 && this.friendCount > 0) {
                userhash = JString.toUserhash(this.socialInput);
                this.delFriend(userhash);
              }
              if (this.socialInputType === 3 && this.socialInput.length > 0 && this.socialUserhash) {
                this.out.p1Enc(148 /* MESSAGE_PRIVATE */);
                this.out.p1(0);
                const start = this.out.pos;
                this.out.p8(this.socialUserhash);
                WordPack.pack(this.out, this.socialInput);
                this.out.psize1(this.out.pos - start);
                this.socialInput = JString.toSentenceCase(this.socialInput);
                this.socialInput = WordFilter.filter(this.socialInput);
                this.addChat(6, this.socialInput, JString.toScreenName(JString.toRawUsername(this.socialUserhash)));
                if (this.chatPrivateMode === 2) {
                  this.chatPrivateMode = 1;
                  this.redrawPrivacySettings = true;
                  this.out.p1Enc(244 /* CHAT_SETMODE */);
                  this.out.p1(this.chatPublicMode);
                  this.out.p1(this.chatPrivateMode);
                  this.out.p1(this.chatTradeMode);
                }
              }
              if (this.socialInputType === 4 && this.ignoreCount < 100) {
                userhash = JString.toUserhash(this.socialInput);
                this.addIgnore(userhash);
              }
              if (this.socialInputType === 5 && this.ignoreCount > 0) {
                userhash = JString.toUserhash(this.socialInput);
                this.delIgnore(userhash);
              }
            }
          } else if (this.dialogInputOpen) {
            if (key >= 48 && key <= 57 && this.dialogInput.length < 10) {
              this.dialogInput = this.dialogInput + String.fromCharCode(key);
              this.redrawChatback = true;
            }
            if (key === 8 && this.dialogInput.length > 0) {
              this.dialogInput = this.dialogInput.substring(0, this.dialogInput.length - 1);
              this.redrawChatback = true;
            }
            if (key === 13 || key === 10) {
              if (this.dialogInput.length > 0) {
                let value = 0;
                try {
                  value = parseInt(this.dialogInput, 10);
                } catch (_e) {}
                this.out.p1Enc(237 /* RESUME_P_COUNTDIALOG */);
                this.out.p4(value);
              }
              this.dialogInputOpen = false;
              this.redrawChatback = true;
            }
          } else if (this.chatComId === -1) {
            if (key >= 32 && (key <= 122 || this.chatInput.startsWith("::") && key <= 126) && this.chatInput.length < 80) {
              this.chatInput = this.chatInput + String.fromCharCode(key);
              this.redrawChatback = true;
            }
            if (key === 8 && this.chatInput.length > 0) {
              this.chatInput = this.chatInput.substring(0, this.chatInput.length - 1);
              this.redrawChatback = true;
            }
            if ((key === 13 || key === 10) && this.chatInput.length > 0) {
              if (this.staffmod) {
                if (this.chatInput === "::clientdrop") {
                  await this.lostCon();
                }
              }
              if (this.chatInput === "::fpson") {
                this.showFps = true;
              } else if (this.chatInput === "::fpsoff") {
                this.showFps = false;
              } else if (this.chatInput.startsWith("::fps ")) {
                try {
                  const desiredFps = parseInt(this.chatInput.substring(6)) || 50;
                  this.setTargetedFramerate(desiredFps);
                } catch (_e) {}
              } else if (this.chatInput.startsWith("::")) {
                this.out.p1Enc(4 /* CLIENT_CHEAT */);
                this.out.p1(this.chatInput.length - 1);
                this.out.pjstr(this.chatInput.substring(2));
              } else {
                let colour = 0;
                if (this.chatInput.startsWith("yellow:")) {
                  colour = 0;
                  this.chatInput = this.chatInput.substring(7);
                } else if (this.chatInput.startsWith("red:")) {
                  colour = 1;
                  this.chatInput = this.chatInput.substring(4);
                } else if (this.chatInput.startsWith("green:")) {
                  colour = 2;
                  this.chatInput = this.chatInput.substring(6);
                } else if (this.chatInput.startsWith("cyan:")) {
                  colour = 3;
                  this.chatInput = this.chatInput.substring(5);
                } else if (this.chatInput.startsWith("purple:")) {
                  colour = 4;
                  this.chatInput = this.chatInput.substring(7);
                } else if (this.chatInput.startsWith("white:")) {
                  colour = 5;
                  this.chatInput = this.chatInput.substring(6);
                } else if (this.chatInput.startsWith("flash1:")) {
                  colour = 6;
                  this.chatInput = this.chatInput.substring(7);
                } else if (this.chatInput.startsWith("flash2:")) {
                  colour = 7;
                  this.chatInput = this.chatInput.substring(7);
                } else if (this.chatInput.startsWith("flash3:")) {
                  colour = 8;
                  this.chatInput = this.chatInput.substring(7);
                } else if (this.chatInput.startsWith("glow1:")) {
                  colour = 9;
                  this.chatInput = this.chatInput.substring(6);
                } else if (this.chatInput.startsWith("glow2:")) {
                  colour = 10;
                  this.chatInput = this.chatInput.substring(6);
                } else if (this.chatInput.startsWith("glow3:")) {
                  colour = 11;
                  this.chatInput = this.chatInput.substring(6);
                }
                let effect = 0;
                if (this.chatInput.startsWith("wave:")) {
                  effect = 1;
                  this.chatInput = this.chatInput.substring(5);
                }
                if (this.chatInput.startsWith("scroll:")) {
                  effect = 2;
                  this.chatInput = this.chatInput.substring(7);
                }
                this.out.p1Enc(158 /* MESSAGE_PUBLIC */);
                this.out.p1(0);
                const start = this.out.pos;
                this.out.p1(colour);
                this.out.p1(effect);
                WordPack.pack(this.out, this.chatInput);
                this.out.psize1(this.out.pos - start);
                this.chatInput = JString.toSentenceCase(this.chatInput);
                this.chatInput = WordFilter.filter(this.chatInput);
                if (this.localPlayer && this.localPlayer.name) {
                  this.localPlayer.chatMessage = this.chatInput;
                  this.localPlayer.chatColour = colour;
                  this.localPlayer.chatEffect = effect;
                  this.localPlayer.chatTimer = 150;
                  this.addChat(2, this.localPlayer.chatMessage, this.localPlayer.name);
                }
                if (this.chatPublicMode === 2) {
                  this.chatPublicMode = 3;
                  this.redrawPrivacySettings = true;
                  this.out.p1Enc(244 /* CHAT_SETMODE */);
                  this.out.p1(this.chatPublicMode);
                  this.out.p1(this.chatPrivateMode);
                  this.out.p1(this.chatTradeMode);
                }
              }
              this.chatInput = "";
              this.redrawChatback = true;
            }
          }
        }
      } while ((key < 97 || key > 122) && (key < 65 || key > 90) && (key < 48 || key > 57) && key !== 32);
      if (this.reportAbuseInput.length < 12) {
        this.reportAbuseInput = this.reportAbuseInput + String.fromCharCode(key);
      }
    }
  }
  followCamera() {
    if (!this.localPlayer) {
      return;
    }
    const orbitX = this.localPlayer.x + this.macroCameraX;
    const orbitZ = this.localPlayer.z + this.macroCameraZ;
    if (this.orbitCameraX - orbitX < -500 || this.orbitCameraX - orbitX > 500 || this.orbitCameraZ - orbitZ < -500 || this.orbitCameraZ - orbitZ > 500) {
      this.orbitCameraX = orbitX;
      this.orbitCameraZ = orbitZ;
    }
    if (this.orbitCameraX !== orbitX) {
      this.orbitCameraX += (orbitX - this.orbitCameraX) / 16 | 0;
    }
    if (this.orbitCameraZ !== orbitZ) {
      this.orbitCameraZ += (orbitZ - this.orbitCameraZ) / 16 | 0;
    }
    if (this.keyHeld[1] === 1) {
      this.orbitCameraYawVelocity += (-this.orbitCameraYawVelocity - 24) / 2 | 0;
    } else if (this.keyHeld[2] === 1) {
      this.orbitCameraYawVelocity += (24 - this.orbitCameraYawVelocity) / 2 | 0;
    } else {
      this.orbitCameraYawVelocity = this.orbitCameraYawVelocity / 2 | 0;
    }
    if (this.keyHeld[3] === 1) {
      this.orbitCameraPitchVelocity += (12 - this.orbitCameraPitchVelocity) / 2 | 0;
    } else if (this.keyHeld[4] === 1) {
      this.orbitCameraPitchVelocity += (-this.orbitCameraPitchVelocity - 12) / 2 | 0;
    } else {
      this.orbitCameraPitchVelocity = this.orbitCameraPitchVelocity / 2 | 0;
    }
    this.orbitCameraYaw = (this.orbitCameraYaw + this.orbitCameraYawVelocity / 2 | 0) & 2047;
    this.orbitCameraPitch += this.orbitCameraPitchVelocity / 2 | 0;
    if (this.orbitCameraPitch < 128) {
      this.orbitCameraPitch = 128;
    } else if (this.orbitCameraPitch > 383) {
      this.orbitCameraPitch = 383;
    }
    const orbitTileX = this.orbitCameraX >> 7;
    const orbitTileZ = this.orbitCameraZ >> 7;
    const orbitY = this.getAvH(this.minusedlevel, this.orbitCameraX, this.orbitCameraZ);
    let maxY = 0;
    if (this.groundh) {
      if (orbitTileX > 3 && orbitTileZ > 3 && orbitTileX < 100 && orbitTileZ < 100) {
        for (let x = orbitTileX - 4;x <= orbitTileX + 4; x++) {
          for (let z = orbitTileZ - 4;z <= orbitTileZ + 4; z++) {
            let level = this.minusedlevel;
            if (level < 3 && this.mapl && (this.mapl[1][x][z] & 2) === 2) {
              level++;
            }
            const y = orbitY - this.groundh[level][x][z];
            if (y > maxY) {
              maxY = y;
            }
          }
        }
      }
    }
    let clamp = maxY * 192;
    if (clamp > 98048) {
      clamp = 98048;
    } else if (clamp < 32768) {
      clamp = 32768;
    }
    if (clamp > this.cameraPitchClamp) {
      this.cameraPitchClamp += (clamp - this.cameraPitchClamp) / 24 | 0;
    } else if (clamp < this.cameraPitchClamp) {
      this.cameraPitchClamp += (clamp - this.cameraPitchClamp) / 80 | 0;
    }
  }
  cinemaCamera() {
    let x = this.camMoveToLx * 128 + 64;
    let z = this.camMoveToLz * 128 + 64;
    let y = this.getAvH(this.minusedlevel, this.camMoveToLx, this.camMoveToLz) - this.camMoveToHei;
    if (this.camX < x) {
      this.camX += this.camMoveToRate + ((x - this.camX) * this.camMoveToRate2 / 1000 | 0);
      if (this.camX > x) {
        this.camX = x;
      }
    }
    if (this.camX > x) {
      this.camX -= this.camMoveToRate + ((this.camX - x) * this.camMoveToRate2 / 1000 | 0);
      if (this.camX < x) {
        this.camX = x;
      }
    }
    if (this.camY < y) {
      this.camY += this.camMoveToRate + ((y - this.camY) * this.camMoveToRate2 / 1000 | 0);
      if (this.camY > y) {
        this.camY = y;
      }
    }
    if (this.camY > y) {
      this.camY -= this.camMoveToRate + ((this.camY - y) * this.camMoveToRate2 / 1000 | 0);
      if (this.camY < y) {
        this.camY = y;
      }
    }
    if (this.camZ < z) {
      this.camZ += this.camMoveToRate + ((z - this.camZ) * this.camMoveToRate2 / 1000 | 0);
      if (this.camZ > z) {
        this.camZ = z;
      }
    }
    if (this.camZ > z) {
      this.camZ -= this.camMoveToRate + ((this.camZ - z) * this.camMoveToRate2 / 1000 | 0);
      if (this.camZ < z) {
        this.camZ = z;
      }
    }
    x = this.camLookAtLx * 128 + 64;
    z = this.camLookAtLz * 128 + 64;
    y = this.getAvH(this.minusedlevel, this.camLookAtLx, this.camLookAtLz) - this.camLookAtHei;
    const dx = x - this.camX;
    const dy = y - this.camY;
    const dz = z - this.camZ;
    const distance = Math.sqrt(dx * dx + dz * dz) | 0;
    let pitch = (Math.atan2(dy, distance) * 325.949 | 0) & 2047;
    const yaw = (Math.atan2(dx, dz) * -325.949 | 0) & 2047;
    if (pitch < 128) {
      pitch = 128;
    } else if (pitch > 383) {
      pitch = 383;
    }
    if (this.camPitch < pitch) {
      this.camPitch += this.camLookAtRate + ((pitch - this.camPitch) * this.camLookAtRate2 / 1000 | 0);
      if (this.camPitch > pitch) {
        this.camPitch = pitch;
      }
    }
    if (this.camPitch > pitch) {
      this.camPitch -= this.camLookAtRate + ((this.camPitch - pitch) * this.camLookAtRate2 / 1000 | 0);
      if (this.camPitch < pitch) {
        this.camPitch = pitch;
      }
    }
    let deltaYaw = yaw - this.camYaw;
    if (deltaYaw > 1024) {
      deltaYaw -= 2048;
    } else if (deltaYaw < -1024) {
      deltaYaw += 2048;
    }
    if (deltaYaw > 0) {
      this.camYaw += this.camLookAtRate + (deltaYaw * this.camLookAtRate2 / 1000 | 0);
      this.camYaw &= 2047;
    }
    if (deltaYaw < 0) {
      this.camYaw -= this.camLookAtRate + (-deltaYaw * this.camLookAtRate2 / 1000 | 0);
      this.camYaw &= 2047;
    }
    let tmp = yaw - this.camYaw;
    if (tmp > 1024) {
      tmp -= 2048;
    } else if (tmp < -1024) {
      tmp += 2048;
    }
    if (tmp < 0 && deltaYaw > 0 || tmp > 0 && deltaYaw < 0) {
      this.camYaw = yaw;
    }
  }
  async soundsDoQueue() {
    for (let wave = 0;wave < this.waveCount; wave++) {
      if (this.waveDelay[wave] <= 0) {
        try {
          const buf = JagFX.generate(this.waveIds[wave], this.waveLoops[wave]);
          if (!buf) {
            throw new Error;
          }
          if (performance.now() + (buf.pos / 22 | 0) > this.lastWaveStartTime + (this.lastWaveLength / 22 | 0)) {
            this.lastWaveLength = buf.pos;
            this.lastWaveStartTime = performance.now();
            this.lastWaveId = this.waveIds[wave];
            this.lastWaveLoops = this.waveLoops[wave];
            await playWave(buf.data.slice(0, buf.pos));
          }
        } catch (_e) {}
        this.waveCount--;
        for (let i = wave;i < this.waveCount; i++) {
          this.waveIds[i] = this.waveIds[i + 1];
          this.waveLoops[i] = this.waveLoops[i + 1];
          this.waveDelay[i] = this.waveDelay[i + 1];
        }
        wave--;
      } else {
        this.waveDelay[wave]--;
      }
    }
    if (this.nextMusicDelay > 0) {
      this.nextMusicDelay -= 20;
      if (this.nextMusicDelay < 0) {
        this.nextMusicDelay = 0;
      }
      if (this.nextMusicDelay === 0 && this.midiActive && !Client.lowMem && this.midiSong) {
        await this.saveMidi(this.midiSong, this.midiCrc, this.midiSize, false);
      }
    }
  }
  movePlayers() {
    for (let i = -1;i < this.playerCount; i++) {
      let index;
      if (i === -1) {
        index = LOCAL_PLAYER_INDEX;
      } else {
        index = this.playerIds[i];
      }
      const player = this.players[index];
      if (player) {
        this.moveEntity(player);
      }
    }
    Client.cyclelogic6++;
    if (Client.cyclelogic6 > 1406) {
      Client.cyclelogic6 = 0;
      this.out.p1Enc(219 /* ANTICHEAT_CYCLELOGIC6 */);
      this.out.p1(0);
      const start = this.out.pos;
      this.out.p1(162);
      this.out.p1(22);
      if ((Math.random() * 2 | 0) === 0) {
        this.out.p1(84);
      }
      this.out.p2(31824);
      this.out.p2(13490);
      if ((Math.random() * 2 | 0) === 0) {
        this.out.p1(123);
      }
      if ((Math.random() * 2 | 0) === 0) {
        this.out.p1(134);
      }
      this.out.p1(100);
      this.out.p1(94);
      this.out.p2(35521);
      this.out.psize1(this.out.pos - start);
    }
  }
  moveNpcs() {
    for (let i = 0;i < this.npcCount; i++) {
      const id = this.npcIds[i];
      const npc = this.npc[id];
      if (npc && npc.type) {
        this.moveEntity(npc);
      }
    }
  }
  moveEntity(e) {
    if (e.x < 128 || e.z < 128 || e.x >= 13184 || e.z >= 13184) {
      e.primaryAnim = -1;
      e.spotanimId = -1;
      e.exactMoveEnd = 0;
      e.exactMoveStart = 0;
      e.x = e.routeX[0] * 128 + e.size * 64;
      e.z = e.routeZ[0] * 128 + e.size * 64;
      e.routeLength = 0;
    }
    if (e === this.localPlayer && (e.x < 1536 || e.z < 1536 || e.x >= 11776 || e.z >= 11776)) {
      e.primaryAnim = -1;
      e.spotanimId = -1;
      e.exactMoveEnd = 0;
      e.exactMoveStart = 0;
      e.x = e.routeX[0] * 128 + e.size * 64;
      e.z = e.routeZ[0] * 128 + e.size * 64;
      e.routeLength = 0;
    }
    if (e.exactMoveEnd > this.loopCycle) {
      this.exactMove1(e);
    } else if (e.exactMoveStart >= this.loopCycle) {
      this.exactMove2(e);
    } else {
      this.routeMove(e);
    }
    this.entityFace(e);
    this.entityAnim(e);
  }
  exactMove1(e) {
    const delta = e.exactMoveEnd - this.loopCycle;
    const dstX = e.exactStartX * 128 + e.size * 64;
    const dstZ = e.exactStartZ * 128 + e.size * 64;
    e.x += (dstX - e.x) / delta | 0;
    e.z += (dstZ - e.z) / delta | 0;
    e.animDelayMove = 0;
    if (e.exactMoveFacing === 0) {
      e.dstYaw = 1024;
    } else if (e.exactMoveFacing === 1) {
      e.dstYaw = 1536;
    } else if (e.exactMoveFacing === 2) {
      e.dstYaw = 0;
    } else if (e.exactMoveFacing === 3) {
      e.dstYaw = 512;
    }
  }
  exactMove2(e) {
    if (e.exactMoveStart === this.loopCycle || e.primaryAnim === -1 || e.primaryAnimDelay !== 0 || e.primaryAnimCycle + 1 > SeqType.list[e.primaryAnim].delay[e.primaryAnimFrame]) {
      const duration = e.exactMoveStart - e.exactMoveEnd;
      const delta = this.loopCycle - e.exactMoveEnd;
      const dx0 = e.exactStartX * 128 + e.size * 64;
      const dz0 = e.exactStartZ * 128 + e.size * 64;
      const dx1 = e.exactEndX * 128 + e.size * 64;
      const dz1 = e.exactEndZ * 128 + e.size * 64;
      e.x = (dx0 * (duration - delta) + dx1 * delta) / duration | 0;
      e.z = (dz0 * (duration - delta) + dz1 * delta) / duration | 0;
    }
    e.animDelayMove = 0;
    if (e.exactMoveFacing === 0) {
      e.dstYaw = 1024;
    } else if (e.exactMoveFacing === 1) {
      e.dstYaw = 1536;
    } else if (e.exactMoveFacing === 2) {
      e.dstYaw = 0;
    } else if (e.exactMoveFacing === 3) {
      e.dstYaw = 512;
    }
    e.yaw = e.dstYaw;
  }
  routeMove(e) {
    e.secondaryAnim = e.readyanim;
    if (e.routeLength === 0) {
      e.animDelayMove = 0;
      return;
    }
    if (e.primaryAnim !== -1 && e.primaryAnimDelay === 0) {
      const seq = SeqType.list[e.primaryAnim];
      if (!seq.walkmerge) {
        e.animDelayMove++;
        return;
      }
    }
    const x = e.x;
    const z = e.z;
    const dstX = e.routeX[e.routeLength - 1] * 128 + e.size * 64;
    const dstZ = e.routeZ[e.routeLength - 1] * 128 + e.size * 64;
    if (dstX - x > 256 || dstX - x < -256 || dstZ - z > 256 || dstZ - z < -256) {
      e.x = dstX;
      e.z = dstZ;
      return;
    }
    if (x < dstX) {
      if (z < dstZ) {
        e.dstYaw = 1280;
      } else if (z > dstZ) {
        e.dstYaw = 1792;
      } else {
        e.dstYaw = 1536;
      }
    } else if (x > dstX) {
      if (z < dstZ) {
        e.dstYaw = 768;
      } else if (z > dstZ) {
        e.dstYaw = 256;
      } else {
        e.dstYaw = 512;
      }
    } else if (z < dstZ) {
      e.dstYaw = 1024;
    } else {
      e.dstYaw = 0;
    }
    let deltaYaw = e.dstYaw - e.yaw & 2047;
    if (deltaYaw > 1024) {
      deltaYaw -= 2048;
    }
    let seqId = e.walkanim_b;
    if (deltaYaw >= -256 && deltaYaw <= 256) {
      seqId = e.walkanim;
    } else if (deltaYaw >= 256 && deltaYaw < 768) {
      seqId = e.walkanim_r;
    } else if (deltaYaw >= -768 && deltaYaw <= -256) {
      seqId = e.walkanim_l;
    }
    if (seqId === -1) {
      seqId = e.walkanim;
    }
    e.secondaryAnim = seqId;
    let moveSpeed = 4;
    if (e.yaw !== e.dstYaw && e.faceEntity === -1) {
      moveSpeed = 2;
    }
    if (e.routeLength > 2) {
      moveSpeed = 6;
    }
    if (e.routeLength > 3) {
      moveSpeed = 8;
    }
    if (e.animDelayMove > 0 && e.routeLength > 1) {
      moveSpeed = 8;
      e.animDelayMove--;
    }
    if (e.routeRun[e.routeLength - 1]) {
      moveSpeed <<= 1;
    }
    if (moveSpeed >= 8 && e.secondaryAnim === e.walkanim && e.runanim !== -1) {
      e.secondaryAnim = e.runanim;
    }
    if (x < dstX) {
      e.x += moveSpeed;
      if (e.x > dstX) {
        e.x = dstX;
      }
    } else if (x > dstX) {
      e.x -= moveSpeed;
      if (e.x < dstX) {
        e.x = dstX;
      }
    }
    if (z < dstZ) {
      e.z += moveSpeed;
      if (e.z > dstZ) {
        e.z = dstZ;
      }
    } else if (z > dstZ) {
      e.z -= moveSpeed;
      if (e.z < dstZ) {
        e.z = dstZ;
      }
    }
    if (e.x === dstX && e.z === dstZ) {
      e.routeLength--;
    }
  }
  entityFace(e) {
    if (e.faceEntity !== -1 && e.faceEntity < 32768) {
      const npc = this.npc[e.faceEntity];
      if (npc) {
        const dstX = e.x - npc.x;
        const dstZ = e.z - npc.z;
        if (dstX !== 0 || dstZ !== 0) {
          e.dstYaw = (Math.atan2(dstX, dstZ) * 325.949 | 0) & 2047;
        }
      }
    }
    if (e.faceEntity >= 32768) {
      let index = e.faceEntity - 32768;
      if (index === this.selfSlot) {
        index = LOCAL_PLAYER_INDEX;
      }
      const player = this.players[index];
      if (player) {
        const dstX = e.x - player.x;
        const dstZ = e.z - player.z;
        if (dstX !== 0 || dstZ !== 0) {
          e.dstYaw = (Math.atan2(dstX, dstZ) * 325.949 | 0) & 2047;
        }
      }
    }
    if ((e.faceSquareX !== 0 || e.faceSquareZ !== 0) && (e.routeLength === 0 || e.animDelayMove > 0)) {
      const dstX = e.x - (e.faceSquareX - this.mapBuildBaseX - this.mapBuildBaseX) * 64;
      const dstZ = e.z - (e.faceSquareZ - this.mapBuildBaseZ - this.mapBuildBaseZ) * 64;
      if (dstX !== 0 || dstZ !== 0) {
        e.dstYaw = (Math.atan2(dstX, dstZ) * 325.949 | 0) & 2047;
      }
      e.faceSquareX = 0;
      e.faceSquareZ = 0;
    }
    const remainingYaw = e.dstYaw - e.yaw & 2047;
    if (remainingYaw !== 0) {
      if (remainingYaw < 32 || remainingYaw > 2048 - 32) {
        e.yaw = e.dstYaw;
      } else if (remainingYaw > 1024) {
        e.yaw -= 32;
      } else {
        e.yaw += 32;
      }
      e.yaw &= 2047;
      if (e.secondaryAnim === e.readyanim && e.yaw !== e.dstYaw) {
        if (e.turnanim != -1) {
          e.secondaryAnim = e.turnanim;
        } else {
          e.secondaryAnim = e.walkanim;
        }
      }
    }
  }
  entityAnim(e) {
    e.needsForwardDrawPadding = false;
    let seq;
    if (e.secondaryAnim !== -1) {
      seq = SeqType.list[e.secondaryAnim];
      e.secondaryAnimCycle++;
      if (seq.delay && e.secondaryAnimFrame < seq.numFrames && e.secondaryAnimCycle > seq.delay[e.secondaryAnimFrame]) {
        e.secondaryAnimCycle = 0;
        e.secondaryAnimFrame++;
      }
      if (e.secondaryAnimFrame >= seq.numFrames) {
        e.secondaryAnimCycle = 0;
        e.secondaryAnimFrame = 0;
      }
    }
    if (e.primaryAnim !== -1 && e.primaryAnimDelay === 0) {
      seq = SeqType.list[e.primaryAnim];
      e.primaryAnimCycle++;
      while (seq.delay && e.primaryAnimFrame < seq.numFrames && e.primaryAnimCycle > seq.delay[e.primaryAnimFrame]) {
        e.primaryAnimCycle -= seq.delay[e.primaryAnimFrame];
        e.primaryAnimFrame++;
      }
      if (e.primaryAnimFrame >= seq.numFrames) {
        e.primaryAnimFrame -= seq.loops;
        e.primaryAnimLoop++;
        if (e.primaryAnimLoop >= seq.maxloops) {
          e.primaryAnim = -1;
        }
        if (e.primaryAnimFrame < 0 || e.primaryAnimFrame >= seq.numFrames) {
          e.primaryAnim = -1;
        }
      }
      e.needsForwardDrawPadding = seq.reachforward;
    }
    if (e.primaryAnimDelay > 0) {
      e.primaryAnimDelay--;
    }
    if (e.spotanimId !== -1 && this.loopCycle >= e.spotanimLastCycle) {
      if (e.spotanimFrame < 0) {
        e.spotanimFrame = 0;
      }
      seq = SpotType.list[e.spotanimId].seq;
      e.spotanimCycle++;
      while (seq && seq.delay && e.spotanimFrame < seq.numFrames && e.spotanimCycle > seq.delay[e.spotanimFrame]) {
        e.spotanimCycle -= seq.delay[e.spotanimFrame];
        e.spotanimFrame++;
      }
      if (seq && e.spotanimFrame >= seq.numFrames) {
        if (e.spotanimFrame < 0 || e.spotanimFrame >= seq.numFrames) {
          e.spotanimId = -1;
        }
      }
    }
  }
  async messageBox(percent, message) {
    console.log(`${percent}%: ${message}`);
    await this.prepareTitle();
    if (!this.title) {
      await super.messageBox(percent, message);
      return;
    }
    this.imageTitle4?.setPixels();
    const x = 360;
    const y = 200;
    const offsetY = 20;
    this.b12?.centreString(x / 2 | 0, (y / 2 | 0) - offsetY - 26, "RuneScape is loading - please wait...", 16777215 /* WHITE */);
    const midY = (y / 2 | 0) - 18 - offsetY;
    Pix2D.drawRect((x / 2 | 0) - 152, midY, 304, 34, 9179409);
    Pix2D.drawRect((x / 2 | 0) - 151, midY + 1, 302, 32, 0 /* BLACK */);
    Pix2D.fillRect((x / 2 | 0) - 150, midY + 2, percent * 3, 30, 9179409);
    Pix2D.fillRect((x / 2 | 0) - 150 + percent * 3, midY + 2, 300 - percent * 3, 30, 0 /* BLACK */);
    this.b12?.centreString(x / 2 | 0, (y / 2 | 0) + 5 - offsetY, message, 16777215 /* WHITE */);
    this.imageTitle4?.draw(214, 186);
    if (this.redrawFrame) {
      this.redrawFrame = false;
      if (!this.flameActive) {
        this.imageTitle0?.draw(0, 0);
        this.imageTitle1?.draw(661, 0);
      }
      this.imageTitle2?.draw(128, 0);
      this.imageTitle3?.draw(214, 386);
      this.imageTitle5?.draw(0, 265);
      this.imageTitle6?.draw(574, 265);
      this.imageTitle7?.draw(128, 186);
      this.imageTitle8?.draw(574, 186);
    }
    await sleep(5);
  }
  gameDraw() {
    if (this.players === null) {
      return;
    }
    if (this.redrawFrame) {
      this.redrawFrame = false;
      this.areaBackleft1?.draw(0, 11);
      this.areaBackleft2?.draw(0, 375);
      this.areaBackright1?.draw(729, 5);
      this.areaBackright2?.draw(752, 231);
      this.areaBacktop1?.draw(0, 0);
      this.areaBacktop2?.draw(561, 0);
      this.areaBackvmid1?.draw(520, 11);
      this.areaBackvmid2?.draw(520, 231);
      this.areaBackvmid3?.draw(501, 375);
      this.areaBackhmid2?.draw(0, 345);
      this.redrawSidebar = true;
      this.redrawChatback = true;
      this.redrawSideicons = true;
      this.redrawPrivacySettings = true;
      if (this.sceneState !== 2) {
        this.areaViewport?.draw(8, 11);
        this.areaMapback?.draw(561, 5);
      }
    }
    if (this.sceneState === 2) {
      this.gameDrawMain();
    }
    if (this.isMenuOpen && this.menuArea === 1) {
      this.redrawSidebar = true;
    }
    if (this.sideModalId !== -1) {
      const redraw = this.animateInterface(this.sideModalId, this.worldUpdateNum);
      if (redraw) {
        this.redrawSidebar = true;
      }
    }
    if (this.selectedArea === 2) {
      this.redrawSidebar = true;
    }
    if (this.objDragArea === 2) {
      this.redrawSidebar = true;
    }
    if (this.redrawSidebar) {
      this.drawSidebar();
      this.redrawSidebar = false;
    }
    if (this.chatComId === -1) {
      this.chatInterface.scrollPos = this.chatScrollHeight - this.chatScrollPos - 77;
      if (this.mouseX > 453 && this.mouseX < 565 && this.mouseY > 350) {
        this.doScrollbar(this.mouseX - 22, this.mouseY - 375, this.chatScrollHeight, 77, false, 463, 0, this.chatInterface);
      }
      let offset = this.chatScrollHeight - this.chatInterface.scrollPos - 77;
      if (offset < 0) {
        offset = 0;
      }
      if (offset > this.chatScrollHeight - 77) {
        offset = this.chatScrollHeight - 77;
      }
      if (this.chatScrollPos !== offset) {
        this.chatScrollPos = offset;
        this.redrawChatback = true;
      }
    }
    if (this.chatComId !== -1) {
      const redraw = this.animateInterface(this.chatComId, this.worldUpdateNum);
      if (redraw) {
        this.redrawChatback = true;
      }
    }
    if (this.selectedArea === 3) {
      this.redrawChatback = true;
    }
    if (this.objDragArea === 3) {
      this.redrawChatback = true;
    }
    if (this.tutComMessage) {
      this.redrawChatback = true;
    }
    if (this.isMenuOpen && this.menuArea === 2) {
      this.redrawChatback = true;
    }
    if (this.redrawChatback) {
      this.drawChat();
      this.redrawChatback = false;
    }
    if (this.sceneState === 2) {
      this.minimapDraw();
      this.areaMapback?.draw(561, 5);
    }
    if (this.tutFlashingTab !== -1) {
      this.redrawSideicons = true;
    }
    if (this.redrawSideicons) {
      if (this.tutFlashingTab !== -1 && this.tutFlashingTab === this.sideTab) {
        this.tutFlashingTab = -1;
        this.out.p1Enc(175 /* TUT_CLICKSIDE */);
        this.out.p1(this.sideTab);
      }
      this.redrawSideicons = false;
      this.areaBackhmid1?.setPixels();
      this.backhmid1?.plotSprite(0, 0);
      if (this.sideModalId === -1) {
        if (this.sideOverlayId[this.sideTab] !== -1) {
          if (this.sideTab === 0) {
            this.redstone1?.plotSprite(29, 30);
          } else if (this.sideTab === 1) {
            this.redstone2?.plotSprite(59, 29);
          } else if (this.sideTab === 2) {
            this.redstone2?.plotSprite(87, 29);
          } else if (this.sideTab === 3) {
            this.redstone3?.plotSprite(115, 29);
          } else if (this.sideTab === 4) {
            this.redstone2h?.plotSprite(156, 29);
          } else if (this.sideTab === 5) {
            this.redstone2h?.plotSprite(184, 29);
          } else if (this.sideTab === 6) {
            this.redstone1h?.plotSprite(212, 30);
          }
        }
        if (this.sideOverlayId[0] !== -1 && (this.tutFlashingTab !== 0 || this.loopCycle % 20 < 10)) {
          this.sideicons[0]?.plotSprite(35, 34);
        }
        if (this.sideOverlayId[1] !== -1 && (this.tutFlashingTab !== 1 || this.loopCycle % 20 < 10)) {
          this.sideicons[1]?.plotSprite(59, 32);
        }
        if (this.sideOverlayId[2] !== -1 && (this.tutFlashingTab !== 2 || this.loopCycle % 20 < 10)) {
          this.sideicons[2]?.plotSprite(86, 32);
        }
        if (this.sideOverlayId[3] !== -1 && (this.tutFlashingTab !== 3 || this.loopCycle % 20 < 10)) {
          this.sideicons[3]?.plotSprite(121, 33);
        }
        if (this.sideOverlayId[4] !== -1 && (this.tutFlashingTab !== 4 || this.loopCycle % 20 < 10)) {
          this.sideicons[4]?.plotSprite(157, 34);
        }
        if (this.sideOverlayId[5] !== -1 && (this.tutFlashingTab !== 5 || this.loopCycle % 20 < 10)) {
          this.sideicons[5]?.plotSprite(185, 32);
        }
        if (this.sideOverlayId[6] !== -1 && (this.tutFlashingTab !== 6 || this.loopCycle % 20 < 10)) {
          this.sideicons[6]?.plotSprite(212, 34);
        }
      }
      this.areaBackhmid1?.draw(520, 165);
      this.areaBackbase2?.setPixels();
      this.backbase2?.plotSprite(0, 0);
      if (this.sideModalId === -1) {
        if (this.sideOverlayId[this.sideTab] !== -1) {
          if (this.sideTab === 7) {
            this.redstone1v?.plotSprite(49, 0);
          } else if (this.sideTab === 8) {
            this.redstone2v?.plotSprite(81, 0);
          } else if (this.sideTab === 9) {
            this.redstone2v?.plotSprite(108, 0);
          } else if (this.sideTab === 10) {
            this.redstone3v?.plotSprite(136, 1);
          } else if (this.sideTab === 11) {
            this.redstone2hv?.plotSprite(178, 0);
          } else if (this.sideTab === 12) {
            this.redstone2hv?.plotSprite(205, 0);
          } else if (this.sideTab === 13) {
            this.redstone1hv?.plotSprite(233, 0);
          }
        }
        if (this.sideOverlayId[8] !== -1 && (this.tutFlashingTab !== 8 || this.loopCycle % 20 < 10)) {
          this.sideicons[7]?.plotSprite(80, 2);
        }
        if (this.sideOverlayId[9] !== -1 && (this.tutFlashingTab !== 9 || this.loopCycle % 20 < 10)) {
          this.sideicons[8]?.plotSprite(107, 3);
        }
        if (this.sideOverlayId[10] !== -1 && (this.tutFlashingTab !== 10 || this.loopCycle % 20 < 10)) {
          this.sideicons[9]?.plotSprite(142, 4);
        }
        if (this.sideOverlayId[11] !== -1 && (this.tutFlashingTab !== 11 || this.loopCycle % 20 < 10)) {
          this.sideicons[10]?.plotSprite(179, 2);
        }
        if (this.sideOverlayId[12] !== -1 && (this.tutFlashingTab !== 12 || this.loopCycle % 20 < 10)) {
          this.sideicons[11]?.plotSprite(206, 2);
        }
        if (this.sideOverlayId[13] !== -1 && (this.tutFlashingTab !== 13 || this.loopCycle % 20 < 10)) {
          this.sideicons[12]?.plotSprite(230, 2);
        }
      }
      this.areaBackbase2?.draw(501, 492);
      this.areaViewport?.setPixels();
    }
    if (this.redrawPrivacySettings) {
      this.redrawPrivacySettings = false;
      this.areaBackbase1?.setPixels();
      this.backbase1?.plotSprite(0, 0);
      this.p12?.centreStringTag(57, 33, "Public chat", 16777215 /* WHITE */, true);
      if (this.chatPublicMode === 0) {
        this.p12?.centreStringTag(57, 46, "On", 65280 /* GREEN */, true);
      }
      if (this.chatPublicMode === 1) {
        this.p12?.centreStringTag(57, 46, "Friends", 16776960 /* YELLOW */, true);
      }
      if (this.chatPublicMode === 2) {
        this.p12?.centreStringTag(57, 46, "Off", 16711680 /* RED */, true);
      }
      if (this.chatPublicMode === 3) {
        this.p12?.centreStringTag(57, 46, "Hide", 65535 /* CYAN */, true);
      }
      this.p12?.centreStringTag(186, 33, "Private chat", 16777215 /* WHITE */, true);
      if (this.chatPrivateMode === 0) {
        this.p12?.centreStringTag(186, 46, "On", 65280 /* GREEN */, true);
      }
      if (this.chatPrivateMode === 1) {
        this.p12?.centreStringTag(186, 46, "Friends", 16776960 /* YELLOW */, true);
      }
      if (this.chatPrivateMode === 2) {
        this.p12?.centreStringTag(186, 46, "Off", 16711680 /* RED */, true);
      }
      this.p12?.centreStringTag(326, 33, "Trade/duel", 16777215 /* WHITE */, true);
      if (this.chatTradeMode === 0) {
        this.p12?.centreStringTag(326, 46, "On", 65280 /* GREEN */, true);
      }
      if (this.chatTradeMode === 1) {
        this.p12?.centreStringTag(326, 46, "Friends", 16776960 /* YELLOW */, true);
      }
      if (this.chatTradeMode === 2) {
        this.p12?.centreStringTag(326, 46, "Off", 16711680 /* RED */, true);
      }
      this.p12?.centreStringTag(462, 38, "Report abuse", 16777215 /* WHITE */, true);
      this.areaBackbase1?.draw(0, 471);
      this.areaViewport?.setPixels();
    }
    this.worldUpdateNum = 0;
    if (this.refNeedCapture && this.localPlayer) {
      this.refNeedCapture = false;
      const wx = (this.localPlayer.x >> 7) + this.mapBuildBaseX;
      const wz = (this.localPlayer.z >> 7) + this.mapBuildBaseZ;
      const locAnims = [];
      for (let loc = this.locList.head();loc !== null; loc = this.locList.next()) {
        let seq = -1;
        try {
          seq = LocType.list(loc.index)?.anim ?? -1;
        } catch {
          seq = -1;
        }
        locAnims.push({
          type: loc.index,
          seq,
          frame: loc.animFrame,
          frames: loc.anim?.numFrames ?? 0,
          duration: loc.anim?.duration ?? 0
        });
      }
      let entities = { playerLines: [], npcLines: [], seqLines: [] };
      try {
        entities = this.collectEntityAnimDump();
      } catch (e) {
        console.warn("entity anim dump failed", e);
      }
      const menu = [];
      for (let i = 0;i < this.menuNumEntries; i++) {
        menu.push(this.menuOption[i] ?? "");
      }
      RefCapture.captureTick({
        loopCycle: this.loopCycle,
        wx,
        wz,
        camYaw: this.camYaw,
        camPitch: this.camPitch,
        mapBuildBaseX: this.mapBuildBaseX,
        mapBuildBaseZ: this.mapBuildBaseZ,
        groundh: this.groundh,
        collision: this.collision,
        world: this.world,
        build: this.refBuild,
        locAnims,
        playerLines: entities.playerLines,
        npcLines: entities.npcLines,
        seqLines: entities.seqLines,
        ui: {
          mainModal: this.mainModalId,
          sideModal: this.sideModalId,
          sideTab: this.sideTab,
          sideOverlay: this.sideOverlayId[this.sideTab] ?? -1,
          chatCom: this.chatComId,
          tutCom: this.tutComId,
          menu
        },
        player: this.localPlayer ? {
          gender: this.localPlayer.gender,
          appearance: Array.from(this.localPlayer.appearance),
          x: this.localPlayer.x,
          z: this.localPlayer.z,
          yaw: this.localPlayer.yaw
        } : null,
        level: this.minusedlevel,
        groundObj: this.groundObj,
        mapl: this.mapl
      });
    }
  }
  gameDrawMain() {
    this.sceneCycle++;
    this.addPlayers();
    this.addNpcs();
    this.addProjectiles();
    this.addMapAnim();
    this.addLocs();
    if (!this.cinemaCam) {
      let pitch = this.orbitCameraPitch;
      if ((this.cameraPitchClamp / 256 | 0) > pitch) {
        pitch = this.cameraPitchClamp / 256 | 0;
      }
      if (this.camShake[4] && this.camShakeRan[4] + 128 > pitch) {
        pitch = this.camShakeRan[4] + 128;
      }
      const yaw = this.orbitCameraYaw + this.macroCameraAngle & 2047;
      if (this.localPlayer) {
        this.camFollow(this.orbitCameraX, this.getAvH(this.minusedlevel, this.localPlayer.x, this.localPlayer.z) - 50, this.orbitCameraZ, yaw, pitch, pitch * 3 + 600);
      }
      Client.cyclelogic2++;
      if (Client.cyclelogic2 > 1802) {
        Client.cyclelogic2 = 0;
        this.out.p1Enc(146 /* ANTICHEAT_CYCLELOGIC2 */);
        this.out.p1(0);
        const start = this.out.pos;
        this.out.p2(29711);
        this.out.p1(70);
        this.out.p1(Math.random() * 256 | 0);
        this.out.p1(242);
        this.out.p1(186);
        this.out.p1(39);
        this.out.p1(61);
        if ((Math.random() * 2 | 0) === 0) {
          this.out.p1(13);
        }
        if ((Math.random() * 2 | 0) === 0) {
          this.out.p2(57856);
        }
        this.out.p2(Math.random() * 65536 | 0);
        this.out.psize1(this.out.pos - start);
      }
    }
    let level;
    if (this.cinemaCam) {
      level = this.roofCheck2();
    } else {
      level = this.roofCheck();
    }
    const camX = this.camX;
    const camY = this.camY;
    const camZ = this.camZ;
    const camPitch = this.camPitch;
    const camYaw = this.camYaw;
    for (let axis = 0;axis < 5; axis++) {
      if (!this.camShake[axis]) {
        continue;
      }
      const jitter = Math.random() * (this.camShakeAxis[axis] * 2 + 1) - this.camShakeAxis[axis] + Math.sin(this.camShakeCycle[axis] * (this.camShakeAmp[axis] / 100)) * this.camShakeRan[axis] | 0;
      if (axis === 0) {
        this.camX += jitter;
      } else if (axis === 1) {
        this.camY += jitter;
      } else if (axis === 2) {
        this.camZ += jitter;
      } else if (axis === 3) {
        this.camYaw = this.camYaw + jitter & 2047;
      } else if (axis === 4) {
        this.camPitch += jitter;
        if (this.camPitch < 128) {
          this.camPitch = 128;
        }
        if (this.camPitch > 383) {
          this.camPitch = 383;
        }
      }
    }
    const cycle = Pix3D.cycle;
    Model.mouseCheck = true;
    Model.pickedCount = 0;
    Model.mouseX = this.mouseX - 8;
    Model.mouseY = this.mouseY - 11;
    Pix2D.cls();
    this.world?.renderAll(this.camX, this.camY, this.camZ, level, this.camYaw, this.camPitch, this.loopCycle);
    this.world?.removeSprites();
    this.entityOverlays();
    this.coordArrow();
    this.textureRunAnims(cycle);
    this.otherOverlays();
    this.areaViewport?.draw(8, 11);
    this.camX = camX;
    this.camY = camY;
    this.camZ = camZ;
    this.camPitch = camPitch;
    this.camYaw = camYaw;
  }
  addPlayers() {
    if (!this.localPlayer) {
      return;
    }
    if (this.localPlayer.x >> 7 === this.minimapFlagX && this.localPlayer.z >> 7 === this.minimapFlagZ) {
      this.minimapFlagX = 0;
    }
    for (let i = -1;i < this.playerCount; i++) {
      let player;
      let id;
      if (i === -1) {
        player = this.localPlayer;
        id = LOCAL_PLAYER_INDEX << 14;
      } else {
        player = this.players[this.playerIds[i]];
        id = this.playerIds[i] << 14;
      }
      if (!player || !player.isReady()) {
        continue;
      }
      player.lowMem = false;
      if ((Client.lowMem && this.playerCount > 50 || this.playerCount > 200) && i != -1 && player.secondaryAnim == player.readyanim) {
        player.lowMem = true;
      }
      const stx = player.x >> 7;
      const stz = player.z >> 7;
      if (stx < 0 || stx >= 104 /* SIZE */ || stz < 0 || stz >= 104 /* SIZE */) {
        continue;
      }
      if (!player.locModel || this.loopCycle < player.locStartCycle || this.loopCycle >= player.locStopCycle) {
        if ((player.x & 127) === 64 && (player.z & 127) === 64) {
          if (this.tileLastOccupiedCycle[stx][stz] == this.sceneCycle) {
            continue;
          }
          this.tileLastOccupiedCycle[stx][stz] = this.sceneCycle;
        }
        player.y = this.getAvH(this.minusedlevel, player.x, player.z);
        this.world?.addDynamic(this.minusedlevel, player.x, player.y, player.z, null, player, id, player.yaw, 60, player.needsForwardDrawPadding);
      } else {
        player.lowMem = false;
        player.y = this.getAvH(this.minusedlevel, player.x, player.z);
        this.world?.addDynamic2(this.minusedlevel, player.x, player.y, player.z, player.minTileX, player.minTileZ, player.maxTileX, player.maxTileZ, null, player, id, player.yaw);
      }
    }
  }
  addNpcs() {
    for (let i = 0;i < this.npcCount; i++) {
      const npc = this.npc[this.npcIds[i]];
      const typecode = (this.npcIds[i] << 14) + 536870912 | 0;
      if (!npc || !npc.isReady()) {
        continue;
      }
      const x = npc.x >> 7;
      const z = npc.z >> 7;
      if (x < 0 || x >= 104 /* SIZE */ || z < 0 || z >= 104 /* SIZE */) {
        continue;
      }
      if (npc.size === 1 && (npc.x & 127) === 64 && (npc.z & 127) === 64) {
        if (this.tileLastOccupiedCycle[x][z] === this.sceneCycle) {
          continue;
        }
        this.tileLastOccupiedCycle[x][z] = this.sceneCycle;
      }
      this.world?.addDynamic(this.minusedlevel, npc.x, this.getAvH(this.minusedlevel, npc.x, npc.z), npc.z, null, npc, typecode, npc.yaw, (npc.size - 1) * 64 + 60, npc.needsForwardDrawPadding);
    }
  }
  addProjectiles() {
    for (let proj = this.projectiles.head();proj !== null; proj = this.projectiles.next()) {
      if (proj.level !== this.minusedlevel || this.loopCycle > proj.t2) {
        proj.unlink();
      } else if (this.loopCycle >= proj.t1) {
        if (proj.target > 0) {
          const npc = this.npc[proj.target - 1];
          if (npc) {
            proj.setTarget(npc.x, this.getAvH(proj.level, npc.x, npc.z) - proj.h2, npc.z, this.loopCycle);
          }
        }
        if (proj.target < 0) {
          const index = -proj.target - 1;
          let player;
          if (index === this.selfSlot) {
            player = this.localPlayer;
          } else {
            player = this.players[index];
          }
          if (player) {
            proj.setTarget(player.x, this.getAvH(proj.level, player.x, player.z) - proj.h2, player.z, this.loopCycle);
          }
        }
        proj.move(this.worldUpdateNum);
        this.world?.addDynamic(this.minusedlevel, proj.x | 0, proj.y | 0, proj.z | 0, null, proj, -1, proj.yaw, 60, false);
      }
    }
  }
  addMapAnim() {
    for (let spot = this.spotanims.head();spot !== null; spot = this.spotanims.next()) {
      if (spot.level !== this.minusedlevel || spot.animComplete) {
        spot.unlink();
      } else if (this.loopCycle >= spot.startCycle) {
        spot.update(this.worldUpdateNum);
        if (spot.animComplete) {
          spot.unlink();
        } else {
          this.world?.addDynamic(spot.level, spot.x, spot.y, spot.z, null, spot, -1, 0, 60, false);
        }
      }
    }
  }
  addLocs() {
    for (let loc = this.locList.head();loc; loc = this.locList.next()) {
      let append = false;
      loc.animCycle += this.worldUpdateNum;
      if (loc.animFrame === -1) {
        loc.animFrame = 0;
        append = true;
      }
      if (loc.anim.delay) {
        while (loc.animCycle > loc.anim.delay[loc.animFrame]) {
          loc.animCycle -= loc.anim.delay[loc.animFrame] + 1;
          loc.animFrame++;
          append = true;
          if (loc.animFrame >= loc.anim.numFrames) {
            loc.animFrame -= loc.anim.loops;
            if (loc.animFrame < 0 || loc.animFrame >= loc.anim.numFrames) {
              loc.unlink();
              append = false;
              break;
            }
          }
        }
      }
      if (append && this.world) {
        const level = loc.heightSW;
        const x = loc.heightNE;
        const z = loc.heightNW;
        let typecode = 0;
        if (loc.heightSE === 0) {
          typecode = this.world.wallType(level, x, z);
        } else if (loc.heightSE === 1) {
          typecode = this.world.decorType(level, z, x);
        } else if (loc.heightSE === 2) {
          typecode = this.world.sceneType(level, x, z);
        } else if (loc.heightSE === 3) {
          typecode = this.world.gdType(level, x, z);
        }
        if (this.groundh && typecode !== 0 && (typecode >> 14 & 32767) === loc.index) {
          const heightmapSW = this.groundh[level][x][z];
          const heightmapSE = this.groundh[level][x + 1][z];
          const heightmapNE = this.groundh[level][x + 1][z + 1];
          const heightmapNW = this.groundh[level][x][z + 1];
          const type = LocType.list(loc.index);
          let seqId = -1;
          if (loc.animFrame !== -1 && loc.anim.frames) {
            seqId = loc.anim.frames[loc.animFrame];
          }
          if (loc.heightSE === 2) {
            const info = this.world.typeCode2(level, x, z, typecode);
            let shape = info & 31;
            const rotation = info >> 6;
            if (shape === 11 /* CENTREPIECE_DIAGONAL */) {
              shape = 10 /* CENTREPIECE_STRAIGHT */;
            }
            this.world?.setLocModel(level, x, z, type.getModel(shape, rotation, heightmapSW, heightmapSE, heightmapNE, heightmapNW, seqId));
          } else if (loc.heightSE === 1) {
            this.world?.setWallDecorationModel(level, x, z, type.getModel(4 /* WALLDECOR_STRAIGHT_NOOFFSET */, 0, heightmapSW, heightmapSE, heightmapNE, heightmapNW, seqId));
          } else if (loc.heightSE === 0) {
            const info = this.world.typeCode2(level, x, z, typecode);
            const shape = info & 31;
            const rotation = info >> 6;
            if (shape === 2 /* WALL_L */) {
              const nextRotation = rotation + 1 & 3;
              this.world?.setWallModels(x, z, level, type.getModel(2 /* WALL_L */, rotation + 4, heightmapSW, heightmapSE, heightmapNE, heightmapNW, seqId), type.getModel(2 /* WALL_L */, nextRotation, heightmapSW, heightmapSE, heightmapNE, heightmapNW, seqId));
            } else {
              this.world?.setWallModel(level, x, z, type.getModel(shape, rotation, heightmapSW, heightmapSE, heightmapNE, heightmapNW, seqId));
            }
          } else if (loc.heightSE === 3) {
            const info = this.world.typeCode2(level, x, z, typecode);
            const rotation = info >> 6;
            this.world?.setGroundDecorationModel(level, x, z, type.getModel(22 /* GROUND_DECOR */, rotation, heightmapSW, heightmapSE, heightmapNE, heightmapNW, seqId));
          }
        } else {
          loc.unlink();
        }
      }
    }
  }
  camFollow(targetX, targetY, targetZ, yaw, pitch, distance) {
    const invPitch = 2048 - pitch & 2047;
    const invYaw = 2048 - yaw & 2047;
    let x = 0;
    let y = 0;
    let z = distance;
    let sin;
    let cos;
    let tmp;
    if (invPitch !== 0) {
      sin = Pix3D.sinTable[invPitch];
      cos = Pix3D.cosTable[invPitch];
      tmp = y * cos - distance * sin >> 16;
      z = y * sin + distance * cos >> 16;
      y = tmp;
    }
    if (invYaw !== 0) {
      sin = Pix3D.sinTable[invYaw];
      cos = Pix3D.cosTable[invYaw];
      tmp = z * sin + x * cos >> 16;
      z = z * cos - x * sin >> 16;
      x = tmp;
    }
    this.camX = targetX - x;
    this.camY = targetY - y;
    this.camZ = targetZ - z;
    this.camPitch = pitch;
    this.camYaw = yaw;
  }
  roofCheck2() {
    if (!this.mapl) {
      return 0;
    }
    const y = this.getAvH(this.minusedlevel, this.camX, this.camZ);
    return y - this.camY >= 800 || (this.mapl[this.minusedlevel][this.camX >> 7][this.camZ >> 7] & 4) === 0 ? 3 : this.minusedlevel;
  }
  roofCheck() {
    let top = 3;
    if (this.camPitch < 310 && this.localPlayer) {
      let cameraLocalTileX = this.camX >> 7;
      let cameraLocalTileZ = this.camZ >> 7;
      const playerLocalTileX = this.localPlayer.x >> 7;
      const playerLocalTileZ = this.localPlayer.z >> 7;
      if (this.mapl && (this.mapl[this.minusedlevel][cameraLocalTileX][cameraLocalTileZ] & 4) !== 0) {
        top = this.minusedlevel;
      }
      let tileDeltaX;
      if (playerLocalTileX > cameraLocalTileX) {
        tileDeltaX = playerLocalTileX - cameraLocalTileX;
      } else {
        tileDeltaX = cameraLocalTileX - playerLocalTileX;
      }
      let tileDeltaZ;
      if (playerLocalTileZ > cameraLocalTileZ) {
        tileDeltaZ = playerLocalTileZ - cameraLocalTileZ;
      } else {
        tileDeltaZ = cameraLocalTileZ - playerLocalTileZ;
      }
      if (tileDeltaX > tileDeltaZ) {
        const delta = tileDeltaZ * 65536 / tileDeltaX | 0;
        let accumulator = 32768;
        while (cameraLocalTileX !== playerLocalTileX) {
          if (cameraLocalTileX < playerLocalTileX) {
            cameraLocalTileX++;
          } else if (cameraLocalTileX > playerLocalTileX) {
            cameraLocalTileX--;
          }
          if (this.mapl && (this.mapl[this.minusedlevel][cameraLocalTileX][cameraLocalTileZ] & 4) !== 0) {
            top = this.minusedlevel;
          }
          accumulator += delta;
          if (accumulator >= 65536) {
            accumulator -= 65536;
            if (cameraLocalTileZ < playerLocalTileZ) {
              cameraLocalTileZ++;
            } else if (cameraLocalTileZ > playerLocalTileZ) {
              cameraLocalTileZ--;
            }
            if (this.mapl && (this.mapl[this.minusedlevel][cameraLocalTileX][cameraLocalTileZ] & 4) !== 0) {
              top = this.minusedlevel;
            }
          }
        }
      } else {
        const delta = tileDeltaX * 65536 / tileDeltaZ | 0;
        let accumulator = 32768;
        while (cameraLocalTileZ !== playerLocalTileZ) {
          if (cameraLocalTileZ < playerLocalTileZ) {
            cameraLocalTileZ++;
          } else if (cameraLocalTileZ > playerLocalTileZ) {
            cameraLocalTileZ--;
          }
          if (this.mapl && (this.mapl[this.minusedlevel][cameraLocalTileX][cameraLocalTileZ] & 4) !== 0) {
            top = this.minusedlevel;
          }
          accumulator += delta;
          if (accumulator >= 65536) {
            accumulator -= 65536;
            if (cameraLocalTileX < playerLocalTileX) {
              cameraLocalTileX++;
            } else if (cameraLocalTileX > playerLocalTileX) {
              cameraLocalTileX--;
            }
            if (this.mapl && (this.mapl[this.minusedlevel][cameraLocalTileX][cameraLocalTileZ] & 4) !== 0) {
              top = this.minusedlevel;
            }
          }
        }
      }
    }
    if (this.localPlayer && this.mapl && (this.mapl[this.minusedlevel][this.localPlayer.x >> 7][this.localPlayer.z >> 7] & 4) !== 0) {
      top = this.minusedlevel;
    }
    return top;
  }
  entityOverlays() {
    this.chatCount = 0;
    for (let index = -1;index < this.playerCount + this.npcCount; index++) {
      let entity = null;
      if (index === -1) {
        entity = this.localPlayer;
      } else if (index < this.playerCount) {
        entity = this.players[this.playerIds[index]];
      } else {
        entity = this.npc[this.npcIds[index - this.playerCount]];
      }
      if (!entity || !entity.isReady()) {
        continue;
      }
      if (index >= this.playerCount) {
        if (this.hintType === 1 && this.hintNpc === this.npcIds[index - this.playerCount] && this.loopCycle % 20 < 10) {
          this.getOverlayPosEntity(entity, entity.height + 15);
          if (this.projectX > -1) {
            this.headicons[2]?.plotSprite(this.projectX - 12, this.projectY - 28);
          }
        }
      } else {
        let y = 30;
        const player = entity;
        if (player.headicons !== 0) {
          this.getOverlayPosEntity(entity, entity.height + 15);
          if (this.projectX > -1) {
            for (let icon = 0;icon < 8; icon++) {
              if ((player.headicons & 1 << icon) !== 0) {
                this.headicons[icon]?.plotSprite(this.projectX - 12, this.projectY - y);
                y -= 25;
              }
            }
          }
        }
        if (index >= 0 && this.hintType === 10 && this.hintPlayer === this.playerIds[index]) {
          this.getOverlayPosEntity(entity, entity.height + 15);
          if (this.projectX > -1) {
            this.headicons[7]?.plotSprite(this.projectX - 12, this.projectY - y);
          }
        }
      }
      if (entity.chatMessage && (index >= this.playerCount || this.chatPublicMode === 0 || this.chatPublicMode === 3 || this.chatPublicMode === 1 && this.isFriend(entity.name))) {
        this.getOverlayPosEntity(entity, entity.height);
        if (this.projectX > -1 && this.chatCount < MAX_CHATS && this.b12) {
          this.chatWidth[this.chatCount] = this.b12.stringWid(entity.chatMessage) / 2 | 0;
          this.chatHeight[this.chatCount] = this.b12.height;
          this.chatX[this.chatCount] = this.projectX;
          this.chatY[this.chatCount] = this.projectY;
          this.chatColour[this.chatCount] = entity.chatColour;
          this.chatEffect[this.chatCount] = entity.chatEffect;
          this.chatTimer[this.chatCount] = entity.chatTimer;
          this.chats[this.chatCount++] = entity.chatMessage;
          if (this.chatEffects === 0 && entity.chatEffect === 1) {
            this.chatHeight[this.chatCount] += 10;
            this.chatY[this.chatCount] += 5;
          }
          if (this.chatEffects === 0 && entity.chatEffect === 2) {
            this.chatWidth[this.chatCount] = 60;
          }
        }
      }
      if (entity.combatCycle > this.loopCycle + 100) {
        this.getOverlayPosEntity(entity, entity.height + 15);
        if (this.projectX > -1) {
          let w = entity.health * 30 / entity.totalHealth | 0;
          if (w > 30) {
            w = 30;
          }
          Pix2D.fillRect(this.projectX - 15, this.projectY - 3, w, 5, 65280 /* GREEN */);
          Pix2D.fillRect(this.projectX - 15 + w, this.projectY - 3, 30 - w, 5, 16711680 /* RED */);
        }
      }
      if (entity.combatCycle > this.loopCycle + 330) {
        this.getOverlayPosEntity(entity, entity.height / 2 | 0);
        if (this.projectX <= -1) {
          continue;
        }
        this.hitmarks[entity.damageType]?.plotSprite(this.projectX - 12, this.projectY - 12);
        this.p11?.centreString(this.projectX, this.projectY + 4, entity.damageValue.toString(), 0 /* BLACK */);
        this.p11?.centreString(this.projectX - 1, this.projectY + 3, entity.damageValue.toString(), 16777215 /* WHITE */);
      }
    }
    for (let i = 0;i < this.chatCount; i++) {
      const x = this.chatX[i];
      let y = this.chatY[i];
      const padding = this.chatWidth[i];
      const height = this.chatHeight[i];
      let sorting = true;
      while (sorting) {
        sorting = false;
        for (let j = 0;j < i; j++) {
          if (y + 2 > this.chatY[j] - this.chatHeight[j] && y - height < this.chatY[j] + 2 && x - padding < this.chatX[j] + this.chatWidth[j] && x + padding > this.chatX[j] - this.chatWidth[j] && this.chatY[j] - this.chatHeight[j] < y) {
            y = this.chatY[j] - this.chatHeight[j];
            sorting = true;
          }
        }
      }
      this.projectX = this.chatX[i];
      this.projectY = this.chatY[i] = y;
      const message = this.chats[i];
      if (this.chatEffects !== 0) {
        this.b12?.centreString(this.projectX, this.projectY + 1, message, 0 /* BLACK */);
        this.b12?.centreString(this.projectX, this.projectY, message, 16776960 /* YELLOW */);
      } else {
        let colour = 16776960 /* YELLOW */;
        if (this.chatColour[i] < 6) {
          colour = CHAT_COLOURS[this.chatColour[i]];
        } else if (this.chatColour[i] === 6) {
          colour = this.sceneCycle % 20 < 10 ? 16711680 /* RED */ : 16776960 /* YELLOW */;
        } else if (this.chatColour[i] === 7) {
          colour = this.sceneCycle % 20 < 10 ? 255 /* BLUE */ : 65535 /* CYAN */;
        } else if (this.chatColour[i] === 8) {
          colour = this.sceneCycle % 20 < 10 ? 45056 : 8454016;
        } else if (this.chatColour[i] === 9) {
          const delta = 150 - this.chatTimer[i];
          if (delta < 50) {
            colour = delta * 1280 + 16711680 /* RED */;
          } else if (delta < 100) {
            colour = 16776960 /* YELLOW */ - (delta - 50) * 327680;
          } else if (delta < 150) {
            colour = (delta - 100) * 5 + 65280 /* GREEN */;
          }
        } else if (this.chatColour[i] === 10) {
          const delta = 150 - this.chatTimer[i];
          if (delta < 50) {
            colour = delta * 5 + 16711680 /* RED */;
          } else if (delta < 100) {
            colour = 16711935 /* MAGENTA */ - (delta - 50) * 327680;
          } else if (delta < 150) {
            colour = (delta - 100) * 327680 + 255 /* BLUE */ - (delta - 100) * 5;
          }
        } else if (this.chatColour[i] === 11) {
          const delta = 150 - this.chatTimer[i];
          if (delta < 50) {
            colour = 16777215 /* WHITE */ - delta * 327685;
          } else if (delta < 100) {
            colour = (delta - 50) * 327685 + 65280 /* GREEN */;
          } else if (delta < 150) {
            colour = 16777215 /* WHITE */ - (delta - 100) * 327680;
          }
        }
        if (this.chatEffect[i] === 0) {
          this.b12?.centreString(this.projectX, this.projectY + 1, message, 0 /* BLACK */);
          this.b12?.centreString(this.projectX, this.projectY, message, colour);
        } else if (this.chatEffect[i] === 1) {
          this.b12?.centreStringWave(this.projectX, this.projectY + 1, message, 0 /* BLACK */, this.sceneCycle);
          this.b12?.centreStringWave(this.projectX, this.projectY, message, colour, this.sceneCycle);
        } else if (this.chatEffect[i] === 2) {
          const w = this.b12?.stringWid(message) ?? 0;
          const offsetX = (150 - this.chatTimer[i]) * (w + 100) / 150;
          Pix2D.setClipping(this.projectX - 50, 0, this.projectX + 50, 334);
          this.b12?.drawString(this.projectX + 50 - offsetX, this.projectY + 1, message, 0 /* BLACK */);
          this.b12?.drawString(this.projectX + 50 - offsetX, this.projectY, message, colour);
          Pix2D.resetClipping();
        }
      }
    }
  }
  coordArrow() {
    if (this.hintType !== 2 || !this.headicons[2]) {
      return;
    }
    this.getOverlayPos((this.hintTileX - this.mapBuildBaseX << 7) + this.hintOffsetX, this.hintHeight * 2, (this.hintTileZ - this.mapBuildBaseZ << 7) + this.hintOffsetZ);
    if (this.projectX > -1 && this.loopCycle % 20 < 10) {
      this.headicons[2].plotSprite(this.projectX - 12, this.projectY - 28);
    }
  }
  textureRunAnims(cycle) {
    if (!Client.lowMem) {
      if (Pix3D.texCycle[17] >= cycle) {
        const texture = Pix3D.textures[17];
        if (!texture) {
          return;
        }
        const bottom = texture.wi * texture.hi - 1;
        const adjustment = texture.wi * this.worldUpdateNum * 2;
        const src = texture.data;
        const dst = this.textureBuffer;
        for (let i = 0;i <= bottom; i++) {
          dst[i] = src[i - adjustment & bottom];
        }
        texture.data = dst;
        this.textureBuffer = src;
        Pix3D.pushTexture(17);
      }
      if (Pix3D.texCycle[24] >= cycle) {
        const texture = Pix3D.textures[24];
        if (!texture) {
          return;
        }
        const bottom = texture.wi * texture.hi - 1;
        const adjustment = texture.wi * this.worldUpdateNum * 2;
        const src = texture.data;
        const dst = this.textureBuffer;
        for (let i = 0;i <= bottom; i++) {
          dst[i] = src[i - adjustment & bottom];
        }
        texture.data = dst;
        this.textureBuffer = src;
        Pix3D.pushTexture(24);
      }
    }
  }
  otherOverlays() {
    this.drawPrivateMessages();
    if (this.crossMode === 1) {
      this.cross[this.crossCycle / 100 | 0]?.plotSprite(this.crossX - 8 - 8, this.crossY - 8 - 11);
    } else if (this.crossMode === 2) {
      this.cross[(this.crossCycle / 100 | 0) + 4]?.plotSprite(this.crossX - 8 - 8, this.crossY - 8 - 11);
    }
    if (this.mainModalId !== -1) {
      this.animateInterface(this.mainModalId, this.worldUpdateNum);
      this.drawInterface(IfType.list[this.mainModalId], 0, 0, 0);
    }
    this.getSpecialArea();
    if (!this.isMenuOpen) {
      this.buildMinimenu();
      this.drawFeedback();
    } else if (this.menuArea === 0) {
      this.drawMinimenu();
    }
    if (this.inMultizone === 1) {
      if (this.wildernessLevel > 0 || this.worldLocationState === 1) {
        this.headicons[1]?.plotSprite(472, 258);
      } else {
        this.headicons[1]?.plotSprite(472, 296);
      }
    }
    if (this.wildernessLevel > 0) {
      this.headicons[0]?.plotSprite(472, 296);
      this.p12?.centreString(484, 329, "Level: " + this.wildernessLevel, 16776960 /* YELLOW */);
    }
    if (this.worldLocationState === 1) {
      this.headicons[6]?.plotSprite(472, 296);
      this.p12?.centreString(484, 329, "Arena", 16776960 /* YELLOW */);
    }
    if (this.showFps) {
      const x = 507;
      let y = 20;
      let colour = 16776960 /* YELLOW */;
      if (this.fps < 15) {
        colour = 16711680 /* RED */;
      }
      this.p12?.drawStringRight(x, y, "Fps:" + this.fps, colour);
      y += 15;
      let memoryUsage = -1;
      if (typeof window.performance["memory"] !== "undefined") {
        const memory = window.performance["memory"];
        memoryUsage = memory.usedJSHeapSize / 1024 | 0;
      }
      if (memoryUsage !== -1) {
        this.p12?.drawStringRight(x, y, "Mem:" + memoryUsage + "k", 16776960 /* YELLOW */);
      }
    }
    if (this.rebootTimer !== 0) {
      let seconds = this.rebootTimer / 50 | 0;
      const minutes = seconds / 60 | 0;
      seconds %= 60;
      if (seconds < 10) {
        this.p12?.drawString(4, 329, "System update in: " + minutes + ":0" + seconds, 16776960 /* YELLOW */);
      } else {
        this.p12?.drawString(4, 329, "System update in: " + minutes + ":" + seconds, 16776960 /* YELLOW */);
      }
    }
  }
  drawPrivateMessages() {
    if (this.splitPrivateChat === 0) {
      return;
    }
    const font = this.p12;
    let lineOffset = 0;
    if (this.rebootTimer !== 0) {
      lineOffset = 1;
    }
    for (let i = 0;i < 100; i++) {
      if (!this.chatText[i]) {
        continue;
      }
      const type = this.chatType[i];
      if ((type == 3 || type == 7) && (type == 7 || this.chatPrivateMode == 0 || this.chatPrivateMode == 1 && this.isFriend(this.chatUsername[i]))) {
        const y = 329 - lineOffset * 13;
        font?.drawString(4, y, "From " + this.chatUsername[i] + ": " + this.chatText[i], 0 /* BLACK */);
        font?.drawString(4, y - 1, "From " + this.chatUsername[i] + ": " + this.chatText[i], 65535 /* CYAN */);
        lineOffset++;
        if (lineOffset >= 5) {
          return;
        }
      } else if (type === 5 && this.chatPrivateMode < 2) {
        const y = 329 - lineOffset * 13;
        font?.drawString(4, y, this.chatText[i], 0 /* BLACK */);
        font?.drawString(4, y - 1, this.chatText[i], 65535 /* CYAN */);
        lineOffset++;
        if (lineOffset >= 5) {
          return;
        }
      } else if (type === 6 && this.chatPrivateMode < 2) {
        const y = 329 - lineOffset * 13;
        font?.drawString(4, y, "To " + this.chatUsername[i] + ": " + this.chatText[i], 0 /* BLACK */);
        font?.drawString(4, y - 1, "To " + this.chatUsername[i] + ": " + this.chatText[i], 65535 /* CYAN */);
        lineOffset++;
        if (lineOffset >= 5) {
          return;
        }
      }
    }
  }
  getSpecialArea() {
    if (!this.localPlayer) {
      return;
    }
    const x = (this.localPlayer.x >> 7) + this.mapBuildBaseX;
    const z = (this.localPlayer.z >> 7) + this.mapBuildBaseZ;
    if (x >= 2944 && x < 3392 && z >= 3520 && z < 6400) {
      this.wildernessLevel = ((z - 3520) / 8 | 0) + 1;
    } else if (x >= 2944 && x < 3392 && z >= 9920 && z < 12800) {
      this.wildernessLevel = ((z - 9920) / 8 | 0) + 1;
    } else {
      this.wildernessLevel = 0;
    }
    this.worldLocationState = 0;
    if (x >= 3328 && x < 3392 && z >= 3200 && z < 3264) {
      const localX = x & 63;
      const localZ = z & 63;
      if (localX >= 4 && localX <= 29 && localZ >= 44 && localZ <= 58) {
        this.worldLocationState = 1;
      } else if (localX >= 36 && localX <= 61 && localZ >= 44 && localZ <= 58) {
        this.worldLocationState = 1;
      } else if (localX >= 4 && localX <= 29 && localZ >= 25 && localZ <= 39) {
        this.worldLocationState = 1;
      } else if (localX >= 36 && localX <= 61 && localZ >= 25 && localZ <= 39) {
        this.worldLocationState = 1;
      } else if (localX >= 4 && localX <= 29 && localZ >= 6 && localZ <= 20) {
        this.worldLocationState = 1;
      } else if (localX >= 36 && localX <= 61 && localZ >= 6 && localZ <= 20) {
        this.worldLocationState = 1;
      }
    }
    if (this.worldLocationState === 0 && x >= 3328 && x <= 3393 && z >= 3203 && z <= 3325) {
      this.worldLocationState = 2;
    }
    this.chatDisabled = 0;
    if (x >= 3053 && x <= 3156 && z >= 3056 && z <= 3136) {
      this.chatDisabled = 1;
    } else if (x >= 3072 && x <= 3118 && z >= 9492 && z <= 9535) {
      this.chatDisabled = 1;
    }
    if (this.chatDisabled === 1 && x >= 3139 && x <= 3199 && z >= 3008 && z <= 3062) {
      this.chatDisabled = 0;
    }
  }
  getOverlayPosEntity(entity, height) {
    this.getOverlayPos(entity.x, height, entity.z);
  }
  getOverlayPos(x, height, z) {
    if (x < 128 || z < 128 || x > 13056 || z > 13056) {
      this.projectX = -1;
      this.projectY = -1;
      return;
    }
    const y = this.getAvH(this.minusedlevel, x, z) - height;
    let dx = x - this.camX;
    let dy = y - this.camY;
    let dz = z - this.camZ;
    const sinPitch = Pix3D.sinTable[this.camPitch];
    const cosPitch = Pix3D.cosTable[this.camPitch];
    const sinYaw = Pix3D.sinTable[this.camYaw];
    const cosYaw = Pix3D.cosTable[this.camYaw];
    let tmp = dz * sinYaw + dx * cosYaw >> 16;
    dz = dz * cosYaw - dx * sinYaw >> 16;
    dx = tmp;
    tmp = dy * cosPitch - dz * sinPitch >> 16;
    dz = dy * sinPitch + dz * cosPitch >> 16;
    dy = tmp;
    if (dz >= 50) {
      this.projectX = Pix3D.originX + ((dx << 9) / dz | 0);
      this.projectY = Pix3D.originY + ((dy << 9) / dz | 0);
    } else {
      this.projectX = -1;
      this.projectY = -1;
    }
  }
  getAvH(level, sceneX, sceneZ) {
    if (!this.groundh) {
      return 0;
    }
    const tileX = sceneX >> 7;
    const tileZ = sceneZ >> 7;
    if (tileX < 0 || tileZ < 0 || tileX > 103 || tileZ > 103) {
      return 0;
    }
    let realLevel = level;
    if (level < 3 && this.mapl && (this.mapl[1][tileX][tileZ] & 2) === 2) {
      realLevel = level + 1;
    }
    const tileLocalX = sceneX & 127;
    const tileLocalZ = sceneZ & 127;
    const y00 = this.groundh[realLevel][tileX][tileZ] * (128 - tileLocalX) + this.groundh[realLevel][tileX + 1][tileZ] * tileLocalX >> 7;
    const y11 = this.groundh[realLevel][tileX][tileZ + 1] * (128 - tileLocalX) + this.groundh[realLevel][tileX + 1][tileZ + 1] * tileLocalX >> 7;
    return y00 * (128 - tileLocalZ) + y11 * tileLocalZ >> 7;
  }
  checkMinimap() {
    if (Client.lowMem && this.sceneState === 2 && ClientBuild.minusedlevel !== this.minusedlevel) {
      this.areaViewport?.setPixels();
      this.p12?.centreString(257, 151, "Loading - please wait.", 0 /* BLACK */);
      this.p12?.centreString(256, 150, "Loading - please wait.", 16777215 /* WHITE */);
      this.areaViewport?.draw(8, 11);
      this.sceneState = 1;
    }
    if (this.sceneState === 1) {
      this.checkScene();
    }
    if (this.sceneState === 2 && this.minusedlevel !== this.minimapLevel) {
      this.minimapLevel = this.minusedlevel;
      this.minimapBuildBuffer(this.minusedlevel);
    }
  }
  checkScene() {
    if (!this.mapBuildGroundData || !this.mapBuildGroundReady || !this.mapBuildLocationData || !this.mapBuildLocationReady) {
      return -1000;
    }
    for (let i = 0;i < this.mapBuildGroundReady.length; i++) {
      if (this.mapBuildGroundReady[i] === false) {
        return -1;
      }
      if (this.mapBuildLocationReady[i] === false) {
        return -2;
      }
    }
    if (this.awaitingPlayerInfo) {
      return -3;
    }
    this.sceneState = 2;
    ClientBuild.minusedlevel = this.minusedlevel;
    this.mapBuild();
    return 0;
  }
  mapBuild() {
    try {
      this.minimapLevel = -1;
      this.locList.clear();
      this.spotanims.clear();
      this.projectiles.clear();
      Pix3D.clearTexels();
      this.clearCaches();
      this.world?.resetMap();
      for (let level = 0;level < 4 /* LEVELS */; level++) {
        this.collision[level]?.reset();
      }
      const build = new ClientBuild(104 /* SIZE */, 104 /* SIZE */, this.groundh, this.mapl);
      const maps = this.mapBuildGroundData?.length ?? 0;
      ClientBuild.lowMem = World.lowMem;
      if (this.mapBuildIndex) {
        for (let index = 0;index < maps; index++) {
          const x = this.mapBuildIndex[index] >> 8;
          const z = this.mapBuildIndex[index] & 255;
          if (x === 33 && z >= 71 && z <= 73) {
            ClientBuild.lowMem = false;
            break;
          }
        }
      }
      if (ClientBuild.lowMem) {
        this.world?.fillBaseLevel(this.minusedlevel);
      } else {
        this.world?.fillBaseLevel(0);
      }
      if (this.mapBuildIndex && this.mapBuildGroundData) {
        this.out.p1Enc(108 /* NO_TIMEOUT */);
        for (let i = 0;i < maps; i++) {
          const x = (this.mapBuildIndex[i] >> 8) * 64 - this.mapBuildBaseX;
          const z = (this.mapBuildIndex[i] & 255) * 64 - this.mapBuildBaseZ;
          const src = this.mapBuildGroundData[i];
          if (src) {
            const data = bzip2_wasm_default.decompress(src, -1, false, true);
            build.loadGround((this.mapBuildCentreZoneX - 6) * 8, (this.mapBuildCentreZoneZ - 6) * 8, x, z, data);
          } else if (this.mapBuildCentreZoneZ < 800) {
            build.clearLandscape(z, x, 64, 64);
          }
        }
      }
      if (this.mapBuildIndex && this.mapBuildLocationData) {
        this.out.p1Enc(108 /* NO_TIMEOUT */);
        for (let i = 0;i < maps; i++) {
          const x = (this.mapBuildIndex[i] >> 8) * 64 - this.mapBuildBaseX;
          const z = (this.mapBuildIndex[i] & 255) * 64 - this.mapBuildBaseZ;
          const src = this.mapBuildLocationData[i];
          if (src) {
            const data = bzip2_wasm_default.decompress(src, -1, false, true);
            build.loadLocations(this.world, this.locList, this.collision, data, x, z);
          }
        }
      }
      this.out.p1Enc(108 /* NO_TIMEOUT */);
      this.refBuild = build;
      build.finishBuild(this.world, this.collision);
      this.areaViewport?.setPixels();
      this.out.p1Enc(108 /* NO_TIMEOUT */);
      for (let loc = this.locList.head();loc; loc = this.locList.next()) {
        if ((this.mapl && this.mapl[1][loc.heightNE][loc.heightNW] & 2) === 2) {
          loc.heightSW--;
          if (loc.heightSW < 0) {
            loc.unlink();
          }
        }
      }
      for (let x = 0;x < 104 /* SIZE */; x++) {
        for (let z = 0;z < 104 /* SIZE */; z++) {
          this.showObject(x, z);
        }
      }
      this.locChangePostBuildCorrect();
    } catch (e) {
      console.error(e);
    }
    LocType.mc1?.clear();
    Pix3D.initPool(20);
  }
  minimapBuildBuffer(level) {
    if (!this.minimap) {
      return;
    }
    const pixels = this.minimap.data;
    const length = pixels.length;
    for (let i = 0;i < length; i++) {
      pixels[i] = 0;
    }
    for (let z = 1;z < 104 /* SIZE */ - 1; z++) {
      let offset = (104 /* SIZE */ - 1 - z) * 512 * 4 + 24628;
      for (let x = 1;x < 104 /* SIZE */ - 1; x++) {
        if (this.mapl && (this.mapl[level][x][z] & 24) === 0) {
          this.world?.render2DGround(level, x, z, pixels, offset, 512);
        }
        if (level < 3 && this.mapl && (this.mapl[level + 1][x][z] & 8) !== 0) {
          this.world?.render2DGround(level + 1, x, z, pixels, offset, 512);
        }
        offset += 4;
      }
    }
    const inactiveRgb = ((Math.random() * 20 | 0) + 238 - 10 << 16) + ((Math.random() * 20 | 0) + 238 - 10 << 8) + (Math.random() * 20 | 0) + 238 - 10;
    const activeRgb = (Math.random() * 20 | 0) + 238 - 10 << 16;
    this.minimap.setPixels();
    for (let z = 1;z < 104 /* SIZE */ - 1; z++) {
      for (let x = 1;x < 104 /* SIZE */ - 1; x++) {
        if (this.mapl && (this.mapl[level][x][z] & 24) === 0) {
          this.drawDetail(x, z, level, inactiveRgb, activeRgb);
        }
        if (level < 3 && this.mapl && (this.mapl[level + 1][x][z] & 8) !== 0) {
          this.drawDetail(x, z, level + 1, inactiveRgb, activeRgb);
        }
      }
    }
    this.areaViewport?.setPixels();
    this.activeMapFunctionCount = 0;
    for (let x = 0;x < 104 /* SIZE */; x++) {
      for (let z = 0;z < 104 /* SIZE */; z++) {
        const typecode = this.world?.gdType(this.minusedlevel, x, z) ?? 0;
        if (typecode === 0) {
          continue;
        }
        const locId = typecode >> 14 & 32767;
        const func = LocType.list(locId).mapfunction;
        if (func < 0) {
          continue;
        }
        let stx = x;
        let stz = z;
        if (func !== 22 && func !== 29 && func !== 34 && func !== 36 && func !== 46 && func !== 47 && func !== 48) {
          const maxX = 104 /* SIZE */;
          const maxZ = 104 /* SIZE */;
          const collisionMap = this.collision[this.minusedlevel];
          if (collisionMap) {
            const flags = collisionMap.flags;
            for (let i = 0;i < 10; i++) {
              const rand = Math.random() * 4 | 0;
              if (rand === 0 && stx > 0 && stx > x - 3 && (flags[CollisionMap.index(stx - 1, stz)] & 2621704 /* PL_WALK_E */) === 0 /* _OPEN */) {
                stx--;
              }
              if (rand === 1 && stx < maxX - 1 && stx < x + 3 && (flags[CollisionMap.index(stx + 1, stz)] & 2621824 /* PL_WALK_W */) === 0 /* _OPEN */) {
                stx++;
              }
              if (rand === 2 && stz > 0 && stz > z - 3 && (flags[CollisionMap.index(stx, stz - 1)] & 2621698 /* PL_WALK_N */) === 0 /* _OPEN */) {
                stz--;
              }
              if (rand === 3 && stz < maxZ - 1 && stz < z + 3 && (flags[CollisionMap.index(stx, stz + 1)] & 2621728 /* PL_WALK_S */) === 0 /* _OPEN */) {
                stz++;
              }
            }
          }
        }
        this.activeMapFunctions[this.activeMapFunctionCount] = this.mapfunction[func];
        this.activeMapFunctionX[this.activeMapFunctionCount] = stx;
        this.activeMapFunctionZ[this.activeMapFunctionCount] = stz;
        this.activeMapFunctionCount++;
      }
    }
  }
  drawDetail(tileX, tileZ, level, inactiveRgb, activeRgb) {
    if (!this.world || !this.minimap) {
      return;
    }
    const wallType = this.world.wallType(level, tileX, tileZ);
    if (wallType !== 0) {
      const info = this.world.typeCode2(level, tileX, tileZ, wallType);
      const angle = info >> 6 & 3;
      const shape = info & 31;
      let rgb = inactiveRgb;
      if (wallType > 0) {
        rgb = activeRgb;
      }
      const dst = this.minimap.data;
      const offset = tileX * 4 + (103 - tileZ) * 512 * 4 + 24624;
      const locId = wallType >> 14 & 32767;
      const loc = LocType.list(locId);
      if (loc.mapscene !== -1) {
        const scene = this.mapscene[loc.mapscene];
        if (scene) {
          const offsetX = (loc.width * 4 - scene.wi) / 2 | 0;
          const offsetY = (loc.length * 4 - scene.hi) / 2 | 0;
          scene.plotSprite(tileX * 4 + 48 + offsetX, (104 /* SIZE */ - tileZ - loc.length) * 4 + offsetY + 48);
        }
      } else {
        if (shape === 0 /* WALL_STRAIGHT */ || shape === 2 /* WALL_L */) {
          if (angle === 0 /* WEST */) {
            dst[offset] = rgb;
            dst[offset + 512] = rgb;
            dst[offset + 1024] = rgb;
            dst[offset + 1536] = rgb;
          } else if (angle === 1 /* NORTH */) {
            dst[offset] = rgb;
            dst[offset + 1] = rgb;
            dst[offset + 2] = rgb;
            dst[offset + 3] = rgb;
          } else if (angle === 2 /* EAST */) {
            dst[offset + 3] = rgb;
            dst[offset + 3 + 512] = rgb;
            dst[offset + 3 + 1024] = rgb;
            dst[offset + 3 + 1536] = rgb;
          } else if (angle === 3 /* SOUTH */) {
            dst[offset + 1536] = rgb;
            dst[offset + 1536 + 1] = rgb;
            dst[offset + 1536 + 2] = rgb;
            dst[offset + 1536 + 3] = rgb;
          }
        }
        if (shape === 3 /* WALL_SQUARE_CORNER */) {
          if (angle === 0 /* WEST */) {
            dst[offset] = rgb;
          } else if (angle === 1 /* NORTH */) {
            dst[offset + 3] = rgb;
          } else if (angle === 2 /* EAST */) {
            dst[offset + 3 + 1536] = rgb;
          } else if (angle === 3 /* SOUTH */) {
            dst[offset + 1536] = rgb;
          }
        }
        if (shape === 2 /* WALL_L */) {
          if (angle === 3 /* SOUTH */) {
            dst[offset] = rgb;
            dst[offset + 512] = rgb;
            dst[offset + 1024] = rgb;
            dst[offset + 1536] = rgb;
          } else if (angle === 0 /* WEST */) {
            dst[offset] = rgb;
            dst[offset + 1] = rgb;
            dst[offset + 2] = rgb;
            dst[offset + 3] = rgb;
          } else if (angle === 1 /* NORTH */) {
            dst[offset + 3] = rgb;
            dst[offset + 3 + 512] = rgb;
            dst[offset + 3 + 1024] = rgb;
            dst[offset + 3 + 1536] = rgb;
          } else if (angle === 2 /* EAST */) {
            dst[offset + 1536] = rgb;
            dst[offset + 1536 + 1] = rgb;
            dst[offset + 1536 + 2] = rgb;
            dst[offset + 1536 + 3] = rgb;
          }
        }
      }
    }
    const sceneType = this.world.sceneType(level, tileX, tileZ);
    if (sceneType !== 0) {
      const info = this.world.typeCode2(level, tileX, tileZ, sceneType);
      const angle = info >> 6 & 3;
      const shape = info & 31;
      const locId = sceneType >> 14 & 32767;
      const loc = LocType.list(locId);
      if (loc.mapscene !== -1) {
        const scene = this.mapscene[loc.mapscene];
        if (scene) {
          const offsetX = (loc.width * 4 - scene.wi) / 2 | 0;
          const offsetY = (loc.length * 4 - scene.hi) / 2 | 0;
          scene.plotSprite(tileX * 4 + 48 + offsetX, (104 /* SIZE */ - tileZ - loc.length) * 4 + offsetY + 48);
        }
      } else {
        if (shape === 9 /* WALL_DIAGONAL */) {
          let rgb = 15658734;
          if (sceneType > 0) {
            rgb = 15597568;
          }
          const dst = this.minimap.data;
          const offset = tileX * 4 + (104 /* SIZE */ - 1 - tileZ) * 512 * 4 + 24624;
          if (angle === 0 /* WEST */ || angle === 2 /* EAST */) {
            dst[offset + 1536] = rgb;
            dst[offset + 1024 + 1] = rgb;
            dst[offset + 512 + 2] = rgb;
            dst[offset + 3] = rgb;
          } else {
            dst[offset] = rgb;
            dst[offset + 512 + 1] = rgb;
            dst[offset + 1024 + 2] = rgb;
            dst[offset + 1536 + 3] = rgb;
          }
        }
      }
    }
    const gdType = this.world.gdType(level, tileX, tileZ);
    if (gdType !== 0) {
      const locId = gdType >> 14 & 32767;
      const loc = LocType.list(locId);
      if (loc.mapscene !== -1) {
        const scene = this.mapscene[loc.mapscene];
        if (scene) {
          const offsetX = (loc.width * 4 - scene.wi) / 2 | 0;
          const offsetY = (loc.length * 4 - scene.hi) / 2 | 0;
          scene.plotSprite(tileX * 4 + 48 + offsetX, (104 /* SIZE */ - tileZ - loc.length) * 4 + offsetY + 48);
        }
      }
    }
  }
  interactWithLoc(opcode, x, z, typecode) {
    if (!this.localPlayer || !this.world) {
      return false;
    }
    const locId = typecode >> 14 & 32767;
    const info = this.world.typeCode2(this.minusedlevel, x, z, typecode);
    if (info === -1) {
      return false;
    }
    const shape = info & 31;
    const angle = info >> 6 & 3;
    if (shape === 10 /* CENTREPIECE_STRAIGHT */ || shape === 11 /* CENTREPIECE_DIAGONAL */ || shape === 22 /* GROUND_DECOR */) {
      const loc = LocType.list(locId);
      let width;
      let height;
      if (angle === 0 /* WEST */ || angle === 2 /* EAST */) {
        width = loc.width;
        height = loc.length;
      } else {
        width = loc.length;
        height = loc.width;
      }
      let forceapproach = loc.forceapproach;
      if (angle !== 0) {
        forceapproach = (forceapproach << angle & 15) + (forceapproach >> 4 - angle);
      }
      this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], x, z, 2, width, height, 0, 0, forceapproach, false);
    } else {
      this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], x, z, 2, 0, 0, angle, shape + 1, 0, false);
    }
    this.crossX = this.mouseClickX;
    this.crossY = this.mouseClickY;
    this.crossMode = 2;
    this.crossCycle = 0;
    this.out.p1Enc(opcode);
    this.out.p2(x + this.mapBuildBaseX);
    this.out.p2(z + this.mapBuildBaseZ);
    this.out.p2(locId);
    return true;
  }
  tryMove(srcX, srcZ, dx, dz, type, locWidth, locLength, locAngle, locShape, forceapproach, tryNearest) {
    const collisionMap = this.collision[this.minusedlevel];
    if (!collisionMap) {
      return false;
    }
    const sceneWidth = 104 /* SIZE */;
    const sceneLength = 104 /* SIZE */;
    for (let x2 = 0;x2 < sceneWidth; x2++) {
      for (let z2 = 0;z2 < sceneLength; z2++) {
        const index = CollisionMap.index(x2, z2);
        this.dirMap[index] = 0;
        this.distMap[index] = 99999999;
      }
    }
    let x = srcX;
    let z = srcZ;
    const srcIndex = CollisionMap.index(srcX, srcZ);
    this.dirMap[srcIndex] = 99;
    this.distMap[srcIndex] = 0;
    let steps = 0;
    let length = 0;
    this.routeX[steps] = srcX;
    this.routeZ[steps++] = srcZ;
    let arrived = false;
    let bufferSize = this.routeX.length;
    const flags = collisionMap.flags;
    while (length !== steps) {
      x = this.routeX[length];
      z = this.routeZ[length];
      length = (length + 1) % bufferSize;
      if (x === dx && z === dz) {
        arrived = true;
        break;
      }
      if (locShape !== 0 /* WALL_STRAIGHT */) {
        if ((locShape < 5 /* WALLDECOR_STRAIGHT_OFFSET */ || locShape === 10 /* CENTREPIECE_STRAIGHT */) && collisionMap.testWall(x, z, dx, dz, locShape - 1, locAngle)) {
          arrived = true;
          break;
        }
        if (locShape < 10 /* CENTREPIECE_STRAIGHT */ && collisionMap.testWDecor(x, z, dx, dz, locShape - 1, locAngle)) {
          arrived = true;
          break;
        }
      }
      if (locWidth !== 0 && locLength !== 0 && collisionMap.testLoc(x, z, dx, dz, locWidth, locLength, forceapproach)) {
        arrived = true;
        break;
      }
      const nextCost = this.distMap[CollisionMap.index(x, z)] + 1;
      let index = CollisionMap.index(x - 1, z);
      if (x > 0 && this.dirMap[index] === 0 && (flags[index] & 2621704 /* PL_WALK_E */) === 0 /* _OPEN */) {
        this.routeX[steps] = x - 1;
        this.routeZ[steps] = z;
        steps = (steps + 1) % bufferSize;
        this.dirMap[index] = 2;
        this.distMap[index] = nextCost;
      }
      index = CollisionMap.index(x + 1, z);
      if (x < sceneWidth - 1 && this.dirMap[index] === 0 && (flags[index] & 2621824 /* PL_WALK_W */) === 0 /* _OPEN */) {
        this.routeX[steps] = x + 1;
        this.routeZ[steps] = z;
        steps = (steps + 1) % bufferSize;
        this.dirMap[index] = 8;
        this.distMap[index] = nextCost;
      }
      index = CollisionMap.index(x, z - 1);
      if (z > 0 && this.dirMap[index] === 0 && (flags[index] & 2621698 /* PL_WALK_N */) === 0 /* _OPEN */) {
        this.routeX[steps] = x;
        this.routeZ[steps] = z - 1;
        steps = (steps + 1) % bufferSize;
        this.dirMap[index] = 1;
        this.distMap[index] = nextCost;
      }
      index = CollisionMap.index(x, z + 1);
      if (z < sceneLength - 1 && this.dirMap[index] === 0 && (flags[index] & 2621728 /* PL_WALK_S */) === 0 /* _OPEN */) {
        this.routeX[steps] = x;
        this.routeZ[steps] = z + 1;
        steps = (steps + 1) % bufferSize;
        this.dirMap[index] = 4;
        this.distMap[index] = nextCost;
      }
      index = CollisionMap.index(x - 1, z - 1);
      if (x > 0 && z > 0 && this.dirMap[index] === 0 && (flags[index] & 2621710 /* PL_WALK_NE */) === 0 && (flags[CollisionMap.index(x - 1, z)] & 2621704 /* PL_WALK_E */) === 0 /* _OPEN */ && (flags[CollisionMap.index(x, z - 1)] & 2621698 /* PL_WALK_N */) === 0 /* _OPEN */) {
        this.routeX[steps] = x - 1;
        this.routeZ[steps] = z - 1;
        steps = (steps + 1) % bufferSize;
        this.dirMap[index] = 3;
        this.distMap[index] = nextCost;
      }
      index = CollisionMap.index(x + 1, z - 1);
      if (x < sceneWidth - 1 && z > 0 && this.dirMap[index] === 0 && (flags[index] & 2621827 /* PL_WALK_NW */) === 0 && (flags[CollisionMap.index(x + 1, z)] & 2621824 /* PL_WALK_W */) === 0 /* _OPEN */ && (flags[CollisionMap.index(x, z - 1)] & 2621698 /* PL_WALK_N */) === 0 /* _OPEN */) {
        this.routeX[steps] = x + 1;
        this.routeZ[steps] = z - 1;
        steps = (steps + 1) % bufferSize;
        this.dirMap[index] = 9;
        this.distMap[index] = nextCost;
      }
      index = CollisionMap.index(x - 1, z + 1);
      if (x > 0 && z < sceneLength - 1 && this.dirMap[index] === 0 && (flags[index] & 2621752 /* PL_WALK_SE */) === 0 && (flags[CollisionMap.index(x - 1, z)] & 2621704 /* PL_WALK_E */) === 0 /* _OPEN */ && (flags[CollisionMap.index(x, z + 1)] & 2621728 /* PL_WALK_S */) === 0 /* _OPEN */) {
        this.routeX[steps] = x - 1;
        this.routeZ[steps] = z + 1;
        steps = (steps + 1) % bufferSize;
        this.dirMap[index] = 6;
        this.distMap[index] = nextCost;
      }
      index = CollisionMap.index(x + 1, z + 1);
      if (x < sceneWidth - 1 && z < sceneLength - 1 && this.dirMap[index] === 0 && (flags[index] & 2621920 /* PL_WALK_SW */) === 0 && (flags[CollisionMap.index(x + 1, z)] & 2621824 /* PL_WALK_W */) === 0 /* _OPEN */ && (flags[CollisionMap.index(x, z + 1)] & 2621728 /* PL_WALK_S */) === 0 /* _OPEN */) {
        this.routeX[steps] = x + 1;
        this.routeZ[steps] = z + 1;
        steps = (steps + 1) % bufferSize;
        this.dirMap[index] = 12;
        this.distMap[index] = nextCost;
      }
    }
    this.tryMoveNearest = 0;
    if (!arrived) {
      if (tryNearest) {
        let min = 100;
        for (let padding = 1;padding < 2; padding++) {
          for (let px = dx - padding;px <= dx + padding; px++) {
            for (let pz = dz - padding;pz <= dz + padding; pz++) {
              const index = CollisionMap.index(px, pz);
              if (px >= 0 && pz >= 0 && px < 104 /* SIZE */ && pz < 104 /* SIZE */ && this.distMap[index] < min) {
                min = this.distMap[index];
                x = px;
                z = pz;
                this.tryMoveNearest = 1;
                arrived = true;
              }
            }
          }
          if (arrived) {
            break;
          }
        }
      }
      if (!arrived) {
        return false;
      }
    }
    length = 0;
    this.routeX[length] = x;
    this.routeZ[length++] = z;
    let dir = this.dirMap[CollisionMap.index(x, z)];
    let next2 = dir;
    while (x !== srcX || z !== srcZ) {
      if (next2 !== dir) {
        dir = next2;
        this.routeX[length] = x;
        this.routeZ[length++] = z;
      }
      if ((next2 & 2 /* EAST */) !== 0) {
        x++;
      } else if ((next2 & 8 /* WEST */) !== 0) {
        x--;
      }
      if ((next2 & 1 /* NORTH */) !== 0) {
        z++;
      } else if ((next2 & 4 /* SOUTH */) !== 0) {
        z--;
      }
      next2 = this.dirMap[CollisionMap.index(x, z)];
    }
    if (length > 0) {
      bufferSize = Math.min(length, 25);
      length--;
      const startX = this.routeX[length];
      const startZ = this.routeZ[length];
      if (type === 0) {
        this.out.p1Enc(181 /* MOVE_GAMECLICK */);
        this.out.p1(bufferSize + bufferSize + 3);
      } else if (type === 1) {
        this.out.p1Enc(165 /* MOVE_MINIMAPCLICK */);
        this.out.p1(bufferSize + bufferSize + 3 + 14);
      } else if (type === 2) {
        this.out.p1Enc(93 /* MOVE_OPCLICK */);
        this.out.p1(bufferSize + bufferSize + 3);
      }
      if (this.keyHeld[5] === 1) {
        this.out.p1(1);
      } else {
        this.out.p1(0);
      }
      this.out.p2(startX + this.mapBuildBaseX);
      this.out.p2(startZ + this.mapBuildBaseZ);
      this.minimapFlagX = this.routeX[0];
      this.minimapFlagZ = this.routeZ[0];
      for (let i = 1;i < bufferSize; i++) {
        length--;
        this.out.p1(this.routeX[length] - startX);
        this.out.p1(this.routeZ[length] - startZ);
      }
      return true;
    }
    return type !== 1;
  }
  async tcpIn() {
    if (!this.stream) {
      return false;
    }
    try {
      let available = this.stream.available;
      if (available === 0) {
        return false;
      }
      if (this.ptype === -1) {
        await this.stream.readBytes(this.in.data, 0, 1);
        this.ptype = this.in.data[0] & 255;
        if (this.randomIn) {
          this.ptype = this.ptype - this.randomIn.nextInt & 255;
        }
        this.psize = ServerProtSizes[this.ptype];
        available--;
      }
      if (this.psize === -1) {
        if (available <= 0) {
          return false;
        }
        await this.stream.readBytes(this.in.data, 0, 1);
        this.psize = this.in.data[0] & 255;
        available--;
      }
      if (this.psize === -2) {
        if (available <= 1) {
          return false;
        }
        await this.stream.readBytes(this.in.data, 0, 2);
        this.in.pos = 0;
        this.psize = this.in.g2();
        available -= 2;
      }
      if (available < this.psize) {
        return false;
      }
      this.in.pos = 0;
      await this.stream.readBytes(this.in.data, 0, this.psize);
      this.timeoutTimer = performance.now();
      this.ptype2 = this.ptype1;
      this.ptype1 = this.ptype0;
      this.ptype0 = this.ptype;
      if (this.ptype === 14 /* IF_OPENCHAT */) {
        const comId = this.in.g2();
        this.ifAnimReset(comId);
        if (this.sideModalId !== -1) {
          this.sideModalId = -1;
          this.redrawSidebar = true;
          this.redrawSideicons = true;
        }
        this.chatComId = comId;
        this.redrawChatback = true;
        this.mainModalId = -1;
        this.resumedPauseButton = false;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 28 /* IF_OPENMAIN_SIDE */) {
        const mainComId = this.in.g2();
        const sideComId = this.in.g2();
        if (this.chatComId !== -1) {
          this.chatComId = -1;
          this.redrawChatback = true;
        }
        if (this.dialogInputOpen) {
          this.dialogInputOpen = false;
          this.redrawChatback = true;
        }
        this.mainModalId = mainComId;
        this.sideModalId = sideComId;
        this.redrawSidebar = true;
        this.redrawSideicons = true;
        this.resumedPauseButton = false;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 129 /* IF_CLOSE */) {
        if (this.sideModalId !== -1) {
          this.sideModalId = -1;
          this.redrawSidebar = true;
          this.redrawSideicons = true;
        }
        if (this.chatComId !== -1) {
          this.chatComId = -1;
          this.redrawChatback = true;
        }
        if (this.dialogInputOpen) {
          this.dialogInputOpen = false;
          this.redrawChatback = true;
        }
        this.mainModalId = -1;
        this.resumedPauseButton = false;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 167 /* IF_SETTAB */) {
        let comId = this.in.g2();
        const tab = this.in.g1();
        if (comId === 65535) {
          comId = -1;
        }
        this.sideOverlayId[tab] = comId;
        this.redrawSidebar = true;
        this.redrawSideicons = true;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 168 /* IF_OPENMAIN */) {
        const comId = this.in.g2();
        this.ifAnimReset(comId);
        if (this.sideModalId !== -1) {
          this.sideModalId = -1;
          this.redrawSidebar = true;
          this.redrawSideicons = true;
        }
        if (this.chatComId !== -1) {
          this.chatComId = -1;
          this.redrawChatback = true;
        }
        if (this.dialogInputOpen) {
          this.dialogInputOpen = false;
          this.redrawChatback = true;
        }
        this.mainModalId = comId;
        this.resumedPauseButton = false;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 195 /* IF_OPENSIDE */) {
        const comId = this.in.g2();
        this.ifAnimReset(comId);
        if (this.chatComId !== -1) {
          this.chatComId = -1;
          this.redrawChatback = true;
        }
        if (this.dialogInputOpen) {
          this.dialogInputOpen = false;
          this.redrawChatback = true;
        }
        this.sideModalId = comId;
        this.redrawSidebar = true;
        this.redrawSideicons = true;
        this.mainModalId = -1;
        this.resumedPauseButton = false;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 84 /* IF_SETTAB_ACTIVE */) {
        this.sideTab = this.in.g1();
        this.redrawSidebar = true;
        this.redrawSideicons = true;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 2 /* IF_SETCOLOUR */) {
        const comId = this.in.g2();
        const colour = this.in.g2();
        const r = colour >> 10 & 31;
        const g = colour >> 5 & 31;
        const b = colour & 31;
        IfType.list[comId].colour = (r << 19) + (g << 11) + (b << 3);
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 26 /* IF_SETHIDE */) {
        const comId = this.in.g2();
        const hide = this.in.g1() === 1;
        IfType.list[comId].hide = hide;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 46 /* IF_SETOBJECT */) {
        const comId = this.in.g2();
        const objId = this.in.g2();
        const zoom = this.in.g2();
        const type = ObjType.list(objId);
        IfType.list[comId].model1 = type.getModelLit(50);
        IfType.list[comId].modelXAn = type.xan2d;
        IfType.list[comId].modelYAn = type.yan2d;
        IfType.list[comId].modelZoom = type.zoom2d * 100 / zoom | 0;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 87 /* IF_SETMODEL */) {
        const comId = this.in.g2();
        const modelId = this.in.g2();
        IfType.list[comId].model1 = Model.load(modelId);
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 103 /* IF_SETRECOL */) {
        const comId = this.in.g2();
        const src = this.in.g2();
        const dst = this.in.g2();
        const com = IfType.list[comId];
        const model = com.model1;
        model?.recolour(src, dst);
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 146 /* IF_SETANIM */) {
        const comId = this.in.g2();
        const seqId = this.in.g2();
        IfType.list[comId].modelAnim = seqId;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 197 /* IF_SETPLAYERHEAD */) {
        const comId = this.in.g2();
        if (this.localPlayer) {
          IfType.list[comId].model1 = this.localPlayer.getHeadModel();
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 201 /* IF_SETTEXT */) {
        const comId = this.in.g2();
        const text = this.in.gjstr();
        IfType.list[comId].text = text;
        if (IfType.list[comId].layerId === this.sideOverlayId[this.sideTab]) {
          this.redrawSidebar = true;
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 204 /* IF_SETNPCHEAD */) {
        const comId = this.in.g2();
        const npcId = this.in.g2();
        const npc = NpcType.list(npcId);
        IfType.list[comId].model1 = npc.getHead();
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 209 /* IF_SETPOSITION */) {
        const comId = this.in.g2();
        const x = this.in.g2b();
        const y = this.in.g2b();
        const com = IfType.list[comId];
        com.x = x;
        com.y = y;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 126 /* TUT_FLASH */) {
        this.tutFlashingTab = this.in.g1();
        if (this.tutFlashingTab === this.sideTab) {
          if (this.tutFlashingTab === 3) {
            this.sideTab = 1;
          } else {
            this.sideTab = 3;
          }
          this.redrawSidebar = true;
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 185 /* TUT_OPEN */) {
        this.tutComId = this.in.g2b();
        this.redrawChatback = true;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 15 /* UPDATE_INV_STOP_TRANSMIT */) {
        const comId = this.in.g2();
        const inv = IfType.list[comId];
        if (!inv.linkObjType || !inv.linkObjNumber) {
          throw new Error;
        }
        for (let i = 0;i < inv.linkObjType.length; i++) {
          inv.linkObjType[i] = -1;
          inv.linkObjType[i] = 0;
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 98 /* UPDATE_INV_FULL */) {
        this.redrawSidebar = true;
        const comId = this.in.g2();
        const inv = IfType.list[comId];
        if (!inv.linkObjType || !inv.linkObjNumber) {
          throw new Error;
        }
        const size = this.in.g1();
        for (let i = 0;i < size; i++) {
          inv.linkObjType[i] = this.in.g2();
          let count = this.in.g1();
          if (count === 255) {
            count = this.in.g4();
          }
          inv.linkObjNumber[i] = count;
        }
        for (let i = size;i < inv.linkObjType.length; i++) {
          inv.linkObjType[i] = 0;
          inv.linkObjNumber[i] = 0;
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 213 /* UPDATE_INV_PARTIAL */) {
        this.redrawSidebar = true;
        const comId = this.in.g2();
        const inv = IfType.list[comId];
        if (!inv.linkObjType || !inv.linkObjNumber) {
          throw new Error;
        }
        while (this.in.pos < this.psize) {
          const slot = this.in.g1();
          const id = this.in.g2();
          let count = this.in.g1();
          if (count === 255) {
            count = this.in.g4();
          }
          if (slot >= 0 && slot < inv.linkObjType.length) {
            inv.linkObjType[slot] = id;
            inv.linkObjNumber[slot] = count;
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 74 /* CAM_LOOKAT */) {
        this.cinemaCam = true;
        this.camLookAtLx = this.in.g1();
        this.camLookAtLz = this.in.g1();
        this.camLookAtHei = this.in.g2();
        this.camLookAtRate = this.in.g1();
        this.camLookAtRate2 = this.in.g1();
        if (this.camLookAtRate2 >= 100) {
          const sceneX = this.camLookAtLx * 128 + 64;
          const sceneZ = this.camLookAtLz * 128 + 64;
          const sceneY = this.getAvH(this.minusedlevel, this.camLookAtLx, this.camLookAtLz) - this.camLookAtHei;
          const deltaX = sceneX - this.camX;
          const deltaY = sceneY - this.camY;
          const deltaZ = sceneZ - this.camZ;
          const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ) | 0;
          this.camPitch = (Math.atan2(deltaY, distance) * 325.949 | 0) & 2047;
          this.camYaw = (Math.atan2(deltaX, deltaZ) * -325.949 | 0) & 2047;
          if (this.camPitch < 128) {
            this.camPitch = 128;
          } else if (this.camPitch > 383) {
            this.camPitch = 383;
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 13 /* CAM_SHAKE */) {
        const axis = this.in.g1();
        const ran = this.in.g1();
        const amp = this.in.g1();
        const rate = this.in.g1();
        this.camShake[axis] = true;
        this.camShakeAxis[axis] = ran;
        this.camShakeRan[axis] = amp;
        this.camShakeAmp[axis] = rate;
        this.camShakeCycle[axis] = 0;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 3 /* CAM_MOVETO */) {
        this.cinemaCam = true;
        this.camMoveToLx = this.in.g1();
        this.camMoveToLz = this.in.g1();
        this.camMoveToHei = this.in.g2();
        this.camMoveToRate = this.in.g1();
        this.camMoveToRate2 = this.in.g1();
        if (this.camMoveToRate2 >= 100) {
          this.camX = this.camMoveToLx * 128 + 64;
          this.camZ = this.camMoveToLz * 128 + 64;
          this.camY = this.getAvH(this.minusedlevel, this.camMoveToLx, this.camMoveToLz) - this.camMoveToHei;
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 239 /* CAM_RESET */) {
        this.cinemaCam = false;
        for (let i = 0;i < 5; i++) {
          this.camShake[i] = false;
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 1 /* NPC_INFO */) {
        this.getNpcPos(this.in, this.psize);
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 184 /* PLAYER_INFO */) {
        this.getPlayerPos(this.in, this.psize);
        this.awaitingPlayerInfo = false;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 133 /* FINISH_TRACKING */) {
        const tracking = InputTracking.stop();
        if (tracking) {
          this.out.p1Enc(81 /* EVENT_TRACKING */);
          this.out.p2(tracking.pos);
          this.out.pdata(tracking.data, tracking.pos, 0);
          tracking.release();
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 226 /* ENABLE_TRACKING */) {
        InputTracking.setEnabled();
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 4 /* MESSAGE_GAME */) {
        const message = this.in.gjstr();
        if (message.endsWith(":tradereq:")) {
          const player = message.substring(0, message.indexOf(":"));
          const username = JString.toUserhash(player);
          let ignored = false;
          for (let i = 0;i < this.ignoreCount; i++) {
            if (this.ignoreUserhash[i] === username) {
              ignored = true;
              break;
            }
          }
          if (!ignored && this.chatDisabled === 0) {
            this.addChat(4, "wishes to trade with you.", player);
          }
        } else if (message.endsWith(":duelreq:")) {
          const player = message.substring(0, message.indexOf(":"));
          const username = JString.toUserhash(player);
          let ignored = false;
          for (let i = 0;i < this.ignoreCount; i++) {
            if (this.ignoreUserhash[i] === username) {
              ignored = true;
              break;
            }
          }
          if (!ignored && this.chatDisabled === 0) {
            this.addChat(8, "wishes to duel with you.", player);
          }
        } else {
          this.addChat(0, message, "");
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 21 /* UPDATE_IGNORELIST */) {
        this.ignoreCount = this.psize / 8 | 0;
        for (let i = 0;i < this.ignoreCount; i++) {
          this.ignoreUserhash[i] = this.in.g8();
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 32 /* CHAT_FILTER_SETTINGS */) {
        this.chatPublicMode = this.in.g1();
        this.chatPrivateMode = this.in.g1();
        this.chatTradeMode = this.in.g1();
        this.redrawPrivacySettings = true;
        this.redrawChatback = true;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 41 /* MESSAGE_PRIVATE */) {
        const from = this.in.g8();
        const messageId = this.in.g4();
        const staffModLevel = this.in.g1();
        let ignored = false;
        for (let i = 0;i < 100; i++) {
          if (this.privateMessageIds[i] === messageId) {
            ignored = true;
            break;
          }
        }
        if (staffModLevel <= 1) {
          for (let i = 0;i < this.ignoreCount; i++) {
            if (this.ignoreUserhash[i] === from) {
              ignored = true;
              break;
            }
          }
        }
        if (!ignored && this.chatDisabled === 0) {
          try {
            this.privateMessageIds[this.privateMessageCount] = messageId;
            this.privateMessageCount = (this.privateMessageCount + 1) % 100;
            const uncompressed = WordPack.unpack(this.in, this.psize - 13);
            const filtered = WordFilter.filter(uncompressed);
            if (staffModLevel > 1) {
              this.addChat(7, filtered, JString.toScreenName(JString.toRawUsername(from)));
            } else {
              this.addChat(3, filtered, JString.toScreenName(JString.toRawUsername(from)));
            }
          } catch (_e) {}
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 152 /* UPDATE_FRIENDLIST */) {
        const username = this.in.g8();
        const world = this.in.g1();
        let displayName = JString.toScreenName(JString.toRawUsername(username));
        for (let i = 0;i < this.friendCount; i++) {
          if (username === this.friendUserhash[i]) {
            if (this.friendNodeId[i] !== world) {
              this.friendNodeId[i] = world;
              this.redrawSidebar = true;
              if (world > 0) {
                this.addChat(5, displayName + " has logged in.", "");
              }
              if (world === 0) {
                this.addChat(5, displayName + " has logged out.", "");
              }
            }
            displayName = null;
            break;
          }
        }
        if (displayName && this.friendCount < 100) {
          this.friendUserhash[this.friendCount] = username;
          this.friendUsername[this.friendCount] = displayName;
          this.friendNodeId[this.friendCount] = world;
          this.friendCount++;
          this.redrawSidebar = true;
        }
        let sorted = false;
        while (!sorted) {
          sorted = true;
          for (let i = 0;i < this.friendCount - 1; i++) {
            if (this.friendNodeId[i] !== Client.nodeId && this.friendNodeId[i + 1] === Client.nodeId || this.friendNodeId[i] === 0 && this.friendNodeId[i + 1] !== 0) {
              const oldWorld = this.friendNodeId[i];
              this.friendNodeId[i] = this.friendNodeId[i + 1];
              this.friendNodeId[i + 1] = oldWorld;
              const oldName = this.friendUsername[i];
              this.friendUsername[i] = this.friendUsername[i + 1];
              this.friendUsername[i + 1] = oldName;
              const oldUserhash = this.friendUserhash[i];
              this.friendUserhash[i] = this.friendUserhash[i + 1];
              this.friendUserhash[i + 1] = oldUserhash;
              this.redrawSidebar = true;
              sorted = false;
            }
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 19 /* UNSET_MAP_FLAG */) {
        this.minimapFlagX = 0;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 22 /* UPDATE_RUNWEIGHT */) {
        if (this.sideTab === 12) {
          this.redrawSidebar = true;
        }
        this.runweight = this.in.g2b();
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 25 /* HINT_ARROW */) {
        this.hintType = this.in.g1();
        if (this.hintType === 1) {
          this.hintNpc = this.in.g2();
        }
        if (this.hintType >= 2 && this.hintType <= 6) {
          if (this.hintType === 2) {
            this.hintOffsetX = 64;
            this.hintOffsetZ = 64;
          } else if (this.hintType === 3) {
            this.hintOffsetX = 0;
            this.hintOffsetZ = 64;
          } else if (this.hintType === 4) {
            this.hintOffsetX = 128;
            this.hintOffsetZ = 64;
          } else if (this.hintType === 5) {
            this.hintOffsetX = 64;
            this.hintOffsetZ = 0;
          } else if (this.hintType === 6) {
            this.hintOffsetX = 64;
            this.hintOffsetZ = 128;
          }
          this.hintType = 2;
          this.hintTileX = this.in.g2();
          this.hintTileZ = this.in.g2();
          this.hintHeight = this.in.g1();
        }
        if (this.hintType === 10) {
          this.hintPlayer = this.in.g2();
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 43 /* UPDATE_REBOOT_TIMER */) {
        this.rebootTimer = this.in.g2() * 30;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 44 /* UPDATE_STAT */) {
        this.redrawSidebar = true;
        const stat = this.in.g1();
        const xp = this.in.g4();
        const level = this.in.g1();
        this.statXP[stat] = xp;
        this.statEffectiveLevel[stat] = level;
        this.statBaseLevel[stat] = 1;
        for (let i = 0;i < 98; i++) {
          if (xp >= Client.levelExperience[i]) {
            this.statBaseLevel[stat] = i + 2;
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 68 /* UPDATE_RUNENERGY */) {
        if (this.sideTab === 12) {
          this.redrawSidebar = true;
        }
        this.runenergy = this.in.g1();
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 136 /* RESET_ANIMS */) {
        for (let i = 0;i < this.players.length; i++) {
          const player = this.players[i];
          if (!player) {
            continue;
          }
          player.primaryAnim = -1;
        }
        for (let i = 0;i < this.npc.length; i++) {
          const npc = this.npc[i];
          if (!npc) {
            continue;
          }
          npc.primaryAnim = -1;
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 139 /* UPDATE_PID */) {
        this.selfSlot = this.in.g2();
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 140 /* LAST_LOGIN_INFO */) {
        this.lastAddress = this.in.g4();
        this.daysSinceLastLogin = this.in.g2();
        this.daysSinceRecoveriesChanged = this.in.g1();
        this.unreadMessages = this.in.g2();
        if (this.lastAddress !== 0 && this.mainModalId === -1) {
          this.closeModal();
          let contentType = 650;
          if (this.daysSinceRecoveriesChanged !== 201) {
            contentType = 655;
          }
          this.reportAbuseInput = "";
          this.reportAbuseMuteOption = false;
          for (let i = 0;i < IfType.list.length; i++) {
            if (IfType.list[i] && IfType.list[i].clientCode === contentType) {
              this.mainModalId = IfType.list[i].layerId;
              break;
            }
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 142 /* LOGOUT */) {
        await this.logout();
        this.ptype = -1;
        return false;
      }
      if (this.ptype === 243 /* P_COUNTDIALOG */) {
        this.socialInputOpen = false;
        this.dialogInputOpen = true;
        this.dialogInput = "";
        this.redrawChatback = true;
        if (this.isMobile) {
          MobileKeyboard_default.show();
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 254 /* SET_MULTIWAY */) {
        this.inMultizone = this.in.g1();
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 20 /* DATA_LOC_DONE */) {
        const x = this.in.g1();
        const z = this.in.g1();
        if (this.mapBuildIndex && this.mapBuildLocationData && this.mapBuildLocationReady) {
          let index = -1;
          for (let i = 0;i < this.mapBuildIndex.length; i++) {
            if (this.mapBuildIndex[i] === (x << 8) + z) {
              index = i;
            }
          }
          if (index !== -1) {
            this.db?.cachesave(`l${x}_${z}`, this.mapBuildLocationData[index]);
            this.mapBuildLocationReady[index] = true;
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 80 /* DATA_LAND_DONE */) {
        const x = this.in.g1();
        const z = this.in.g1();
        if (this.mapBuildIndex && this.mapBuildGroundData && this.mapBuildGroundReady) {
          let index = -1;
          for (let i = 0;i < this.mapBuildIndex.length; i++) {
            if (this.mapBuildIndex[i] === (x << 8) + z) {
              index = i;
            }
          }
          if (index !== -1) {
            this.db?.cachesave(`m${x}_${z}`, this.mapBuildGroundData[index]);
            this.mapBuildGroundReady[index] = true;
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 132 /* DATA_LAND */) {
        const x = this.in.g1();
        const z = this.in.g1();
        const off = this.in.g2();
        const length = this.in.g2();
        let index = -1;
        if (this.mapBuildIndex) {
          for (let i = 0;i < this.mapBuildIndex.length; i++) {
            if (this.mapBuildIndex[i] === (x << 8) + z) {
              index = i;
            }
          }
        }
        if (index !== -1 && this.mapBuildGroundData) {
          if (!this.mapBuildGroundData[index] || this.mapBuildGroundData[index]?.length !== length) {
            this.mapBuildGroundData[index] = new Uint8Array(length);
          }
          const data = this.mapBuildGroundData[index];
          if (data) {
            this.in.gdata(this.psize - 6, off, data);
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 220 /* DATA_LOC */) {
        const x = this.in.g1();
        const z = this.in.g1();
        const off = this.in.g2();
        const length = this.in.g2();
        let index = -1;
        if (this.mapBuildIndex) {
          for (let i = 0;i < this.mapBuildIndex.length; i++) {
            if (this.mapBuildIndex[i] === (x << 8) + z) {
              index = i;
            }
          }
        }
        if (index !== -1 && this.mapBuildLocationData) {
          if (!this.mapBuildLocationData[index] || this.mapBuildLocationData[index]?.length !== length) {
            this.mapBuildLocationData[index] = new Uint8Array(length);
          }
          const data = this.mapBuildLocationData[index];
          if (data) {
            this.in.gdata(this.psize - 6, off, data);
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 237 /* REBUILD_NORMAL */) {
        const zoneX = this.in.g2();
        const zoneZ = this.in.g2();
        if (this.mapBuildCentreZoneX === zoneX && this.mapBuildCentreZoneZ === zoneZ && this.sceneState === 2) {
          this.ptype = -1;
          return true;
        }
        this.mapBuildCentreZoneX = zoneX;
        this.mapBuildCentreZoneZ = zoneZ;
        this.mapBuildBaseX = (this.mapBuildCentreZoneX - 6) * 8;
        this.mapBuildBaseZ = (this.mapBuildCentreZoneZ - 6) * 8;
        this.sceneState = 1;
        this.areaViewport?.setPixels();
        this.p12?.centreString(257, 151, "Loading - please wait.", 0 /* BLACK */);
        this.p12?.centreString(256, 150, "Loading - please wait.", 16777215 /* WHITE */);
        this.areaViewport?.draw(8, 11);
        const regions = (this.psize - 2) / 10 | 0;
        this.mapBuildGroundData = new TypedArray1d(regions, null);
        this.mapBuildGroundReady = new TypedArray1d(regions, false);
        this.mapBuildLocationData = new TypedArray1d(regions, null);
        this.mapBuildLocationReady = new TypedArray1d(regions, false);
        this.mapBuildIndex = new Int32Array(regions);
        this.out.p1Enc(150 /* REBUILD_GETMAPS */);
        this.out.p1(0);
        let mapCount = 0;
        for (let i = 0;i < regions; i++) {
          const mapsquareX = this.in.g1();
          const mapsquareZ = this.in.g1();
          const landCrc = this.in.g4();
          const locCrc = this.in.g4();
          this.mapBuildIndex[i] = (mapsquareX << 8) + mapsquareZ;
          let data;
          if (landCrc !== 0) {
            data = await this.db?.cacheload(`m${mapsquareX}_${mapsquareZ}`);
            if (data && Packet.getcrc(data, 0, data.length) !== landCrc) {
              data = undefined;
            }
            if (!data) {
              this.out.p1(0);
              this.out.p1(mapsquareX);
              this.out.p1(mapsquareZ);
              mapCount += 3;
            } else {
              this.mapBuildGroundData[i] = data;
              this.mapBuildGroundReady[i] = true;
            }
          } else {
            this.mapBuildGroundReady[i] = true;
          }
          if (locCrc !== 0) {
            data = await this.db?.cacheload(`l${mapsquareX}_${mapsquareZ}`);
            if (data && Packet.getcrc(data, 0, data.length) !== locCrc) {
              data = undefined;
            }
            if (!data) {
              this.out.p1(1);
              this.out.p1(mapsquareX);
              this.out.p1(mapsquareZ);
              mapCount += 3;
            } else {
              this.mapBuildLocationData[i] = data;
              this.mapBuildLocationReady[i] = true;
            }
          } else {
            this.mapBuildLocationReady[i] = true;
          }
        }
        this.out.psize1(mapCount);
        this.areaViewport?.setPixels();
        if (this.sceneState === 0) {
          this.p12?.centreString(257, 166, "Map area updated since last visit, so load will take longer this time only", 0 /* BLACK */);
          this.p12?.centreString(256, 165, "Map area updated since last visit, so load will take longer this time only", 16777215 /* WHITE */);
        }
        this.areaViewport?.draw(8, 11);
        const dx = this.mapBuildBaseX - this.mapBuildPrevBaseX;
        const dz = this.mapBuildBaseZ - this.mapBuildPrevBaseZ;
        this.mapBuildPrevBaseX = this.mapBuildBaseX;
        this.mapBuildPrevBaseZ = this.mapBuildBaseZ;
        for (let i = 0;i < 8192; i++) {
          const npc = this.npc[i];
          if (npc) {
            for (let j = 0;j < 10; j++) {
              npc.routeX[j] -= dx;
              npc.routeZ[j] -= dz;
            }
            npc.x -= dx * 128;
            npc.z -= dz * 128;
          }
        }
        for (let i = 0;i < MAX_PLAYER_COUNT; i++) {
          const player = this.players[i];
          if (player) {
            for (let j = 0;j < 10; j++) {
              player.routeX[j] -= dx;
              player.routeZ[j] -= dz;
            }
            player.x -= dx * 128;
            player.z -= dz * 128;
          }
        }
        this.awaitingPlayerInfo = true;
        let startTileX = 0;
        let endTileX = 104 /* SIZE */;
        let dirX = 1;
        if (dx < 0) {
          startTileX = 104 /* SIZE */ - 1;
          endTileX = -1;
          dirX = -1;
        }
        let startTileZ = 0;
        let endTileZ = 104 /* SIZE */;
        let dirZ = 1;
        if (dz < 0) {
          startTileZ = 104 /* SIZE */ - 1;
          endTileZ = -1;
          dirZ = -1;
        }
        for (let x = startTileX;x !== endTileX; x += dirX) {
          for (let z = startTileZ;z !== endTileZ; z += dirZ) {
            const lastX = x + dx;
            const lastZ = z + dz;
            for (let level = 0;level < 4 /* LEVELS */; level++) {
              if (lastX >= 0 && lastZ >= 0 && lastX < 104 /* SIZE */ && lastZ < 104 /* SIZE */) {
                this.groundObj[level][x][z] = this.groundObj[level][lastX][lastZ];
              } else {
                this.groundObj[level][x][z] = null;
              }
            }
          }
        }
        for (let loc = this.locChanges.head();loc !== null; loc = this.locChanges.next()) {
          loc.x -= dx;
          loc.z -= dz;
          if (loc.x < 0 || loc.z < 0 || loc.x >= 104 /* SIZE */ || loc.z >= 104 /* SIZE */) {
            loc.unlink();
          }
        }
        if (this.minimapFlagX !== 0) {
          this.minimapFlagX -= dx;
          this.minimapFlagZ -= dz;
        }
        this.cinemaCam = false;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 150 /* VARP_SMALL */) {
        const varpId = this.in.g2();
        const value = this.in.g1b();
        this.varServ[varpId] = value;
        if (this.var[varpId] !== value) {
          this.var[varpId] = value;
          await this.clientVar(varpId);
          this.redrawSidebar = true;
          if (this.tutComId !== -1) {
            this.redrawChatback = true;
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 175 /* VARP_LARGE */) {
        const varpId = this.in.g2();
        const value = this.in.g4();
        this.varServ[varpId] = value;
        if (this.var[varpId] !== value) {
          this.var[varpId] = value;
          await this.clientVar(varpId);
          this.redrawSidebar = true;
          if (this.tutComId !== -1) {
            this.redrawChatback = true;
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 193 /* VARP_SYNC */) {
        for (let i = 0;i < this.var.length; i++) {
          if (this.var[i] !== this.varServ[i]) {
            this.var[i] = this.varServ[i];
            await this.clientVar(i);
            this.redrawSidebar = true;
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 12 /* SYNTH_SOUND */) {
        const soundId = this.in.g2();
        const loops = this.in.g1();
        const delay = this.in.g2();
        if (this.waveEnabled && !Client.lowMem && this.waveCount < 50) {
          this.waveIds[this.waveCount] = soundId;
          this.waveLoops[this.waveCount] = loops;
          this.waveDelay[this.waveCount] = delay + JagFX.delays[soundId];
          this.waveCount++;
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 54 /* MIDI_SONG */) {
        const name = this.in.gjstr();
        const crc = this.in.g4();
        const length = this.in.g4();
        if (!(name === this.midiSong) && this.midiActive && !Client.lowMem) {
          await this.saveMidi(name, crc, length, true);
        }
        this.midiSong = name;
        this.midiCrc = crc;
        this.midiSize = length;
        this.nextMusicDelay = 0;
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 212 /* MIDI_JINGLE */) {
        if (this.midiActive && !Client.lowMem) {
          const delay = this.in.g2();
          const data = this.in.data.subarray(this.in.pos, this.psize);
          const uncompressed = bzip2_wasm_default.decompress(data, -1, false, true);
          playMidi(uncompressed, this.midiVolume, false);
          this.nextMusicDelay = delay;
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 7 /* UPDATE_ZONE_PARTIAL_FOLLOWS */) {
        this.zoneUpdateX = this.in.g1();
        this.zoneUpdateZ = this.in.g1();
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 135 /* UPDATE_ZONE_FULL_FOLLOWS */) {
        this.zoneUpdateX = this.in.g1();
        this.zoneUpdateZ = this.in.g1();
        for (let x = this.zoneUpdateX;x < this.zoneUpdateX + 8; x++) {
          for (let z = this.zoneUpdateZ;z < this.zoneUpdateZ + 8; z++) {
            if (this.groundObj[this.minusedlevel][x][z]) {
              this.groundObj[this.minusedlevel][x][z] = null;
              this.showObject(x, z);
            }
          }
        }
        for (let loc = this.locChanges.head();loc !== null; loc = this.locChanges.next()) {
          if (loc.x >= this.zoneUpdateX && loc.x < this.zoneUpdateX + 8 && loc.z >= this.zoneUpdateZ && loc.z < this.zoneUpdateZ + 8 && loc.level === this.minusedlevel) {
            loc.endTime = 0;
          }
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 162 /* UPDATE_ZONE_PARTIAL_ENCLOSED */) {
        this.zoneUpdateX = this.in.g1();
        this.zoneUpdateZ = this.in.g1();
        while (this.in.pos < this.psize) {
          const opcode = this.in.g1();
          this.zonePacket(this.in, opcode);
        }
        this.ptype = -1;
        return true;
      }
      if (this.ptype === 151 /* OBJ_COUNT */ || this.ptype === 23 /* P_LOCMERGE */ || this.ptype === 50 /* OBJ_REVEAL */ || this.ptype === 191 /* MAP_ANIM */ || this.ptype === 69 /* MAP_PROJANIM */ || this.ptype === 49 /* OBJ_DEL */ || this.ptype === 223 /* OBJ_ADD */ || this.ptype === 42 /* LOC_ANIM */ || this.ptype === 76 /* LOC_DEL */ || this.ptype === 59 /* LOC_ADD_CHANGE */) {
        this.zonePacket(this.in, this.ptype);
        this.ptype = -1;
        return true;
      }
      console.error(`T1 - ${this.ptype},${this.psize} - ${this.ptype1},${this.ptype2}`);
      await this.logout();
    } catch (e) {
      if (e instanceof WebSocket && e.readyState === 3) {
        await this.lostCon();
      } else {
        console.error(e);
        let str = `T2 - ${this.ptype},${this.psize} - ${this.ptype1},${this.ptype2} - ${this.psize},${(this.localPlayer?.routeX[0] ?? 0) + this.mapBuildBaseX},${(this.localPlayer?.routeZ[0] ?? 0) + this.mapBuildBaseZ} -`;
        for (let i = 0;i < this.psize && i < 50; i++) {
          str += this.in.data[i] + ",";
        }
        console.error(str);
        await this.logout();
      }
    }
    return true;
  }
  zonePacket(buf, opcode) {
    const pos = buf.g1();
    let x = this.zoneUpdateX + (pos >> 4 & 7);
    let z = this.zoneUpdateZ + (pos & 7);
    if (opcode === 59 /* LOC_ADD_CHANGE */) {
      const info = buf.g1();
      const id = buf.g2();
      const shape = info >> 2;
      const rotate = info & 3;
      const layer = LOC_SHAPE_TO_LAYER[shape];
      if (x >= 0 && z >= 0 && x < 104 /* SIZE */ && z < 104 /* SIZE */) {
        this.locChangeCreate(-1, id, rotate, layer, z, shape, this.minusedlevel, x, 0);
      }
    } else if (opcode === 76 /* LOC_DEL */) {
      const info = buf.g1();
      const shape = info >> 2;
      const rotate = info & 3;
      const layer = LOC_SHAPE_TO_LAYER[shape];
      if (x >= 0 && z >= 0 && x < 104 /* SIZE */ && z < 104 /* SIZE */) {
        this.locChangeCreate(-1, -1, rotate, layer, z, shape, this.minusedlevel, x, 0);
      }
    } else if (opcode === 42 /* LOC_ANIM */) {
      const info = buf.g1();
      const seq = buf.g2();
      const shape = info >> 2;
      const layer = LOC_SHAPE_TO_LAYER[shape];
      if (x >= 0 && z >= 0 && x < 104 /* SIZE */ && z < 104 /* SIZE */ && this.world) {
        let typecode = 0;
        if (layer === 0 /* WALL */) {
          typecode = this.world.wallType(this.minusedlevel, x, z);
        } else if (layer === 1 /* WALL_DECOR */) {
          typecode = this.world.decorType(this.minusedlevel, z, x);
        } else if (layer === 2 /* GROUND */) {
          typecode = this.world.sceneType(this.minusedlevel, x, z);
        } else if (layer === 3 /* GROUND_DECOR */) {
          typecode = this.world.gdType(this.minusedlevel, x, z);
        }
        if (typecode !== 0) {
          const loc = new ClientLocAnim(typecode >> 14 & 32767, this.minusedlevel, layer, x, z, SeqType.list[seq], false);
          this.locList.push(loc);
        }
      }
    } else if (opcode === 223 /* OBJ_ADD */) {
      const type = buf.g2();
      const count = buf.g2();
      if (x >= 0 && z >= 0 && x < 104 /* SIZE */ && z < 104 /* SIZE */) {
        const obj = new ClientObj(type, count);
        if (!this.groundObj[this.minusedlevel][x][z]) {
          this.groundObj[this.minusedlevel][x][z] = new LinkList;
        }
        this.groundObj[this.minusedlevel][x][z]?.push(obj);
        this.showObject(x, z);
      }
    } else if (opcode === 49 /* OBJ_DEL */) {
      const type = buf.g2();
      if (x >= 0 && z >= 0 && x < 104 /* SIZE */ && z < 104 /* SIZE */) {
        const objs = this.groundObj[this.minusedlevel][x][z];
        if (objs) {
          for (let obj = objs.head();obj !== null; obj = objs.next()) {
            if (obj.id === (type & 32767)) {
              obj.unlink();
              break;
            }
          }
          if (objs.head() === null) {
            this.groundObj[this.minusedlevel][x][z] = null;
          }
          this.showObject(x, z);
        }
      }
    } else if (opcode === 69 /* MAP_PROJANIM */) {
      let x2 = x + buf.g1b();
      let z2 = z + buf.g1b();
      const targetEntity = buf.g2b();
      const spotanim = buf.g2();
      const h1 = buf.g1();
      const h2 = buf.g1();
      const t1 = buf.g2();
      const t2 = buf.g2();
      const angle = buf.g1();
      const startpos = buf.g1();
      if (x >= 0 && z >= 0 && x < 104 /* SIZE */ && z < 104 /* SIZE */ && x2 >= 0 && z2 >= 0 && x2 < 104 /* SIZE */ && z2 < 104 /* SIZE */) {
        x = x * 128 + 64;
        z = z * 128 + 64;
        x2 = x2 * 128 + 64;
        z2 = z2 * 128 + 64;
        const proj = new ClientProj(spotanim, this.minusedlevel, x, this.getAvH(this.minusedlevel, x, z) - h1, z, t1 + this.loopCycle, t2 + this.loopCycle, angle, startpos, targetEntity, h2);
        proj.setTarget(x2, this.getAvH(this.minusedlevel, x2, z2) - h2, z2, t1 + this.loopCycle);
        this.projectiles.push(proj);
      }
    } else if (opcode === 191 /* MAP_ANIM */) {
      const spotanim = buf.g2();
      const height = buf.g1();
      const time = buf.g2();
      if (x >= 0 && z >= 0 && x < 104 /* SIZE */ && z < 104 /* SIZE */) {
        x = x * 128 + 64;
        z = z * 128 + 64;
        const spot = new MapSpotAnim(spotanim, this.minusedlevel, x, z, this.getAvH(this.minusedlevel, x, z) - height, this.loopCycle, time);
        this.spotanims.push(spot);
      }
    } else if (opcode === 50 /* OBJ_REVEAL */) {
      const id = buf.g2();
      const count = buf.g2();
      const pid = buf.g2();
      if (x >= 0 && z >= 0 && x < 104 /* SIZE */ && z < 104 /* SIZE */ && pid !== this.selfSlot) {
        if (!this.groundObj[this.minusedlevel][x][z]) {
          this.groundObj[this.minusedlevel][x][z] = new LinkList;
        }
        const obj = new ClientObj(id, count);
        this.groundObj[this.minusedlevel][x][z]?.push(obj);
        this.showObject(x, z);
      }
    } else if (opcode === 23 /* P_LOCMERGE */) {
      const info = buf.g1();
      const shape = info >> 2;
      const rotate = info & 3;
      const layer = LOC_SHAPE_TO_LAYER[shape];
      const id = buf.g2();
      const t1 = buf.g2();
      const t2 = buf.g2();
      const pid = buf.g2();
      let east = buf.g1b();
      let south = buf.g1b();
      let west = buf.g1b();
      let north = buf.g1b();
      let player;
      if (pid === this.selfSlot) {
        player = this.localPlayer;
      } else {
        player = this.players[pid];
      }
      if (player && this.groundh) {
        const loc = LocType.list(id);
        const heightSW = this.groundh[this.minusedlevel][x][z];
        const heightSE = this.groundh[this.minusedlevel][x + 1][z];
        const heightNE = this.groundh[this.minusedlevel][x + 1][z + 1];
        const heightNW = this.groundh[this.minusedlevel][x][z + 1];
        this.locChangeCreate(t1 + this.loopCycle, -1, rotate, layer, z, shape, this.minusedlevel, x, t2 + this.loopCycle);
        player.locStartCycle = t1 + this.loopCycle;
        player.locStopCycle = t2 + this.loopCycle;
        player.locModel = loc.getModel(shape, rotate, heightSW, heightSE, heightNE, heightNW, -1);
        let width = loc.width;
        let height = loc.length;
        if (rotate === 1 /* NORTH */ || rotate === 3 /* SOUTH */) {
          width = loc.length;
          height = loc.width;
        }
        player.locOffsetX = x * 128 + width * 64;
        player.locOffsetZ = z * 128 + height * 64;
        player.locOffsetY = this.getAvH(this.minusedlevel, player.locOffsetX, player.locOffsetZ);
        let tmp;
        if (east > west) {
          tmp = east;
          east = west;
          west = tmp;
        }
        if (south > north) {
          tmp = south;
          south = north;
          north = tmp;
        }
        player.minTileX = x + east;
        player.maxTileX = x + west;
        player.minTileZ = z + south;
        player.maxTileZ = z + north;
      }
    } else if (opcode === 151 /* OBJ_COUNT */) {
      const type = buf.g2();
      const ocount = buf.g2();
      const count = buf.g2();
      if (x >= 0 && z >= 0 && x < 104 /* SIZE */ && z < 104 /* SIZE */) {
        const objs = this.groundObj[this.minusedlevel][x][z];
        if (objs) {
          for (let obj = objs.head();obj !== null; obj = objs.next()) {
            if (obj.id === (type & 32767) && obj.count === ocount) {
              obj.count = count;
              break;
            }
          }
          this.showObject(x, z);
        }
      }
    }
  }
  locChangeCreate(endTime, type, angle, layer, z, shape, level, x, startTime) {
    let loc = null;
    for (let next2 = this.locChanges.head();next2 !== null; next2 = this.locChanges.next()) {
      if (next2.level === this.minusedlevel && next2.x === x && next2.z === z && next2.layer === layer) {
        loc = next2;
        break;
      }
    }
    if (!loc) {
      loc = new LocChange;
      loc.level = level;
      loc.layer = layer;
      loc.x = x;
      loc.z = z;
      this.locChangeSetOld(loc);
      this.locChanges.push(loc);
    }
    loc.newType = type;
    loc.newShape = shape;
    loc.newAngle = angle;
    loc.startTime = startTime;
    loc.endTime = endTime;
  }
  locChangePostBuildCorrect() {
    for (let loc = this.locChanges.head();loc !== null; loc = this.locChanges.next()) {
      if (loc.endTime === -1) {
        loc.startTime = 0;
        this.locChangeSetOld(loc);
      } else {
        loc.unlink();
      }
    }
  }
  locChangeSetOld(loc) {
    if (!this.world) {
      return;
    }
    let typecode = 0;
    let otherId = -1;
    let otherShape = 0;
    let otherAngle = 0;
    if (loc.layer === 0 /* WALL */) {
      typecode = this.world.wallType(loc.level, loc.x, loc.z);
    } else if (loc.layer === 1 /* WALL_DECOR */) {
      typecode = this.world.decorType(loc.level, loc.z, loc.x);
    } else if (loc.layer === 2 /* GROUND */) {
      typecode = this.world.sceneType(loc.level, loc.x, loc.z);
    } else if (loc.layer === 3 /* GROUND_DECOR */) {
      typecode = this.world.gdType(loc.level, loc.x, loc.z);
    }
    if (typecode !== 0) {
      const otherInfo = this.world.typeCode2(loc.level, loc.x, loc.z, typecode);
      otherId = typecode >> 14 & 32767;
      otherShape = otherInfo & 31;
      otherAngle = otherInfo >> 6;
    }
    loc.oldType = otherId;
    loc.oldShape = otherShape;
    loc.oldAngle = otherAngle;
  }
  locChangeDoQueue() {
    if (this.sceneState !== 2) {
      return;
    }
    for (let loc = this.locChanges.head();loc !== null; loc = this.locChanges.next()) {
      if (loc.endTime > 0) {
        loc.endTime--;
      }
      if (loc.endTime != 0) {
        if (loc.startTime > 0) {
          loc.startTime--;
        }
        if (loc.startTime === 0 && loc.x >= 1 && loc.z >= 1 && loc.x <= 102 && loc.z <= 102) {
          this.locChangeUnchecked(loc.level, loc.x, loc.z, loc.newType, loc.newAngle, loc.newShape, loc.layer);
          loc.startTime = -1;
          if (loc.oldType === loc.newType && loc.oldType === -1) {
            loc.unlink();
          } else if (loc.oldType === loc.newType && loc.oldAngle === loc.newAngle && loc.oldShape === loc.newShape) {
            loc.unlink();
          }
        }
      } else {
        this.locChangeUnchecked(loc.level, loc.x, loc.z, loc.oldType, loc.oldAngle, loc.oldShape, loc.layer);
        loc.unlink();
      }
    }
    Client.cyclelogic5++;
    if (Client.cyclelogic5 > 85) {
      Client.cyclelogic5 = 0;
      this.out.p1Enc(85 /* ANTICHEAT_CYCLELOGIC5 */);
    }
  }
  locChangeUnchecked(level, x, z, id, angle, shape, layer) {
    if (x < 1 || z < 1 || x > 102 || z > 102) {
      return;
    }
    if (Client.lowMem && level !== this.minusedlevel) {
      return;
    }
    if (!this.world) {
      return;
    }
    let typecode = 0;
    if (layer === 0 /* WALL */) {
      typecode = this.world.wallType(level, x, z);
    } else if (layer === 1 /* WALL_DECOR */) {
      typecode = this.world.decorType(level, z, x);
    } else if (layer === 2 /* GROUND */) {
      typecode = this.world.sceneType(level, x, z);
    } else if (layer === 3 /* GROUND_DECOR */) {
      typecode = this.world.gdType(level, x, z);
    }
    if (typecode !== 0) {
      const otherInfo = this.world.typeCode2(level, x, z, typecode);
      const otherId = typecode >> 14 & 32767;
      const otherShape = otherInfo & 31;
      const otherAngle = otherInfo >> 6;
      if (layer === 0 /* WALL */) {
        this.world?.delWall(level, x, z);
        const type = LocType.list(otherId);
        if (type.blockwalk) {
          this.collision[level]?.delWall(x, z, otherShape, otherAngle, type.blockrange);
        }
      } else if (layer === 1 /* WALL_DECOR */) {
        this.world?.delDecor(level, x, z);
      } else if (layer === 2 /* GROUND */) {
        this.world.delLoc(level, x, z);
        const type = LocType.list(otherId);
        if (x + type.width > 104 /* SIZE */ - 1 || z + type.width > 104 /* SIZE */ - 1 || x + type.length > 104 /* SIZE */ - 1 || z + type.length > 104 /* SIZE */ - 1) {
          return;
        }
        if (type.blockwalk) {
          this.collision[level]?.delLoc(x, z, type.width, type.length, otherAngle, type.blockrange);
        }
      } else if (layer === 3 /* GROUND_DECOR */) {
        this.world?.delGroundDecor(level, x, z);
        const type = LocType.list(otherId);
        if (type.blockwalk && type.active) {
          this.collision[level]?.unblockGround(x, z);
        }
      }
    }
    if (id >= 0) {
      let tileLevel = level;
      if (this.mapl && level < 3 && (this.mapl[1][x][z] & 2) === 2) {
        tileLevel = level + 1;
      }
      if (this.groundh) {
        ClientBuild.changeLocUnchecked(level, x, z, this.world, this.groundh, this.locList, this.collision[level], id, shape, angle, tileLevel);
      }
    }
  }
  showObject(x, z) {
    const objs = this.groundObj[this.minusedlevel][x][z];
    if (!objs) {
      this.world?.delObj(this.minusedlevel, x, z);
      return;
    }
    let topCost = -99999999;
    let topObj = null;
    for (let obj = objs.head();obj !== null; obj = objs.next()) {
      const type2 = ObjType.list(obj.id);
      let cost = type2.cost;
      if (type2.stackable) {
        cost *= obj.count + 1;
      }
      if (cost > topCost) {
        topCost = cost;
        topObj = obj;
      }
    }
    if (!topObj) {
      return;
    }
    objs.pushFront(topObj);
    let bottomObjId = -1;
    let middleObjId = -1;
    let bottomObjCount = 0;
    let middleObjCount = 0;
    for (let obj = objs.head();obj; obj = objs.next()) {
      if (obj.id !== topObj.id && bottomObjId === -1) {
        bottomObjId = obj.id;
        bottomObjCount = obj.count;
      }
      if (obj.id !== topObj.id && obj.id !== bottomObjId && middleObjId === -1) {
        middleObjId = obj.id;
        middleObjCount = obj.count;
      }
    }
    let bottomObj = null;
    if (bottomObjId !== -1) {
      bottomObj = ObjType.list(bottomObjId).getModelLit(bottomObjCount);
    }
    let middleObj = null;
    if (middleObjId !== -1) {
      middleObj = ObjType.list(middleObjId).getModelLit(middleObjCount);
    }
    const typecode = x + (z << 7) + 1610612736 | 0;
    const type = ObjType.list(topObj.id);
    this.world?.setObj(x, z, this.getAvH(this.minusedlevel, x * 128 + 64, z * 128 + 64), this.minusedlevel, typecode, type.getModelLit(topObj.count), middleObj, bottomObj);
  }
  getPlayerPos(buf, size) {
    this.entityRemovalCount = 0;
    this.entityUpdateCount = 0;
    this.getPlayerPosLocal(buf, size);
    this.getPlayerPosOldVis(buf, size);
    this.getPlayerPosNewVis(buf, size);
    this.getPlayerPosExtended(buf, size);
    for (let i = 0;i < this.entityRemovalCount; i++) {
      const index = this.entityRemovalIds[i];
      const player = this.players[index];
      if (!player) {
        continue;
      }
      if (player.cycle !== this.loopCycle) {
        this.players[index] = null;
      }
    }
    if (buf.pos !== size) {
      console.error(`Error packet size mismatch in getplayer pos:${buf.pos} psize:${size}`);
      throw new Error("eek");
    }
    for (let index = 0;index < this.playerCount; index++) {
      if (!this.players[this.playerIds[index]]) {
        console.error(`${this.loginUser} null entry in pl list - pos:${index} size:${this.playerCount}`);
        throw new Error("eek");
      }
    }
  }
  getPlayerPosLocal(buf, _size) {
    buf.gBitStart();
    const info = buf.gBit(1);
    if (info !== 0) {
      const op = buf.gBit(2);
      if (op === 0) {
        this.entityUpdateIds[this.entityUpdateCount++] = LOCAL_PLAYER_INDEX;
      } else if (op === 1) {
        const walkDir = buf.gBit(3);
        this.localPlayer?.moveCode(false, walkDir);
        const extendedInfo = buf.gBit(1);
        if (extendedInfo === 1) {
          this.entityUpdateIds[this.entityUpdateCount++] = LOCAL_PLAYER_INDEX;
        }
      } else if (op === 2) {
        const walkDir = buf.gBit(3);
        this.localPlayer?.moveCode(true, walkDir);
        const runDir = buf.gBit(3);
        this.localPlayer?.moveCode(true, runDir);
        const extendedInfo = buf.gBit(1);
        if (extendedInfo === 1) {
          this.entityUpdateIds[this.entityUpdateCount++] = LOCAL_PLAYER_INDEX;
        }
      } else if (op === 3) {
        this.minusedlevel = buf.gBit(2);
        const localX = buf.gBit(7);
        const localZ = buf.gBit(7);
        const jump = buf.gBit(1);
        this.localPlayer?.teleport(jump === 1, localX, localZ);
        const extendedInfo = buf.gBit(1);
        if (extendedInfo === 1) {
          this.entityUpdateIds[this.entityUpdateCount++] = LOCAL_PLAYER_INDEX;
        }
      }
    }
  }
  getPlayerPosOldVis(buf, _size) {
    const count = buf.gBit(8);
    if (count < this.playerCount) {
      for (let i = count;i < this.playerCount; i++) {
        this.entityRemovalIds[this.entityRemovalCount++] = this.playerIds[i];
      }
    }
    if (count > this.playerCount) {
      console.error(`eek! ${this.loginUser} Too many players`);
      throw new Error;
    }
    this.playerCount = 0;
    for (let i = 0;i < count; i++) {
      const index = this.playerIds[i];
      const player = this.players[index];
      const info = buf.gBit(1);
      if (info === 0) {
        this.playerIds[this.playerCount++] = index;
        if (player) {
          player.cycle = this.loopCycle;
        }
      } else {
        const op = buf.gBit(2);
        if (op === 0) {
          this.playerIds[this.playerCount++] = index;
          if (player) {
            player.cycle = this.loopCycle;
          }
          this.entityUpdateIds[this.entityUpdateCount++] = index;
        } else if (op === 1) {
          this.playerIds[this.playerCount++] = index;
          if (player) {
            player.cycle = this.loopCycle;
          }
          const walkDir = buf.gBit(3);
          player?.moveCode(false, walkDir);
          const extendedInfo = buf.gBit(1);
          if (extendedInfo === 1) {
            this.entityUpdateIds[this.entityUpdateCount++] = index;
          }
        } else if (op === 2) {
          this.playerIds[this.playerCount++] = index;
          if (player) {
            player.cycle = this.loopCycle;
          }
          const walkDir = buf.gBit(3);
          player?.moveCode(true, walkDir);
          const runDir = buf.gBit(3);
          player?.moveCode(true, runDir);
          const extendedInfo = buf.gBit(1);
          if (extendedInfo === 1) {
            this.entityUpdateIds[this.entityUpdateCount++] = index;
          }
        } else if (op === 3) {
          this.entityRemovalIds[this.entityRemovalCount++] = index;
        }
      }
    }
  }
  getPlayerPosNewVis(buf, size) {
    while (buf.bitPos + 10 < size * 8) {
      const index = buf.gBit(11);
      if (index === 2047) {
        break;
      }
      if (!this.players[index]) {
        this.players[index] = new ClientPlayer;
        const appearance = this.playerAppearanceBuffer[index];
        if (appearance) {
          this.players[index]?.setAppearance(appearance);
        }
      }
      this.playerIds[this.playerCount++] = index;
      const player = this.players[index];
      if (player) {
        player.cycle = this.loopCycle;
      }
      let dx = buf.gBit(5);
      if (dx > 15) {
        dx -= 32;
      }
      let dz = buf.gBit(5);
      if (dz > 15) {
        dz -= 32;
      }
      const jump = buf.gBit(1);
      if (this.localPlayer) {
        player?.teleport(jump === 1, this.localPlayer.routeX[0] + dx, this.localPlayer.routeZ[0] + dz);
      }
      const extendedInfo = buf.gBit(1);
      if (extendedInfo === 1) {
        this.entityUpdateIds[this.entityUpdateCount++] = index;
      }
    }
    buf.gBitEnd();
  }
  getPlayerPosExtended(buf, _size) {
    for (let i = 0;i < this.entityUpdateCount; i++) {
      const index = this.entityUpdateIds[i];
      const player = this.players[index];
      if (!player) {
        continue;
      }
      let mask = buf.g1();
      if ((mask & 128 /* BIG_UPDATE */) !== 0) {
        mask += buf.g1() << 8;
      }
      this.getPlayerPosDecodeExtended(player, index, mask, buf);
    }
  }
  getPlayerPosDecodeExtended(player, index, mask, buf) {
    if ((mask & 1 /* APPEARANCE */) !== 0) {
      const length = buf.g1();
      const data = new Uint8Array(length);
      const appearance = new Packet(data);
      buf.gdata(length, 0, data);
      this.playerAppearanceBuffer[index] = appearance;
      player.setAppearance(appearance);
    }
    if ((mask & 2 /* ANIM */) !== 0) {
      let seqId = buf.g2();
      if (seqId === 65535) {
        seqId = -1;
      }
      if (seqId === player.primaryAnim) {
        player.primaryAnimLoop = 0;
      }
      const delay = buf.g1();
      if (seqId === -1 || player.primaryAnim === -1 || SeqType.list[seqId].priority > SeqType.list[player.primaryAnim].priority || SeqType.list[player.primaryAnim].priority === 0) {
        player.primaryAnim = seqId;
        player.primaryAnimFrame = 0;
        player.primaryAnimCycle = 0;
        player.primaryAnimDelay = delay;
        player.primaryAnimLoop = 0;
      }
    }
    if ((mask & 4 /* FACEENTITY */) !== 0) {
      player.faceEntity = buf.g2();
      if (player.faceEntity === 65535) {
        player.faceEntity = -1;
      }
    }
    if ((mask & 8 /* SAY */) !== 0) {
      player.chatMessage = buf.gjstr();
      player.chatColour = 0;
      player.chatEffect = 0;
      player.chatTimer = 150;
      if (player.name) {
        this.addChat(2, player.chatMessage, player.name);
      }
    }
    if ((mask & 16 /* HITMARK */) !== 0) {
      player.damageValue = buf.g1();
      player.damageType = buf.g1();
      player.combatCycle = this.loopCycle + 400;
      player.health = buf.g1();
      player.totalHealth = buf.g1();
    }
    if ((mask & 32 /* FACESQUARE */) !== 0) {
      player.faceSquareX = buf.g2();
      player.faceSquareZ = buf.g2();
    }
    if ((mask & 64 /* CHAT */) !== 0) {
      const colourEffect = buf.g2();
      const type = buf.g1();
      const length = buf.g1();
      const start = buf.pos;
      if (player.name) {
        const username = JString.toUserhash(player.name);
        let ignored = false;
        if (type <= 1) {
          for (let i = 0;i < this.ignoreCount; i++) {
            if (this.ignoreUserhash[i] === username) {
              ignored = true;
              break;
            }
          }
        }
        if (!ignored && this.chatDisabled === 0) {
          try {
            const uncompressed = WordPack.unpack(buf, length);
            const filtered = WordFilter.filter(uncompressed);
            player.chatMessage = filtered;
            player.chatColour = colourEffect >> 8;
            player.chatEffect = colourEffect & 255;
            player.chatTimer = 150;
            if (type > 1) {
              this.addChat(1, filtered, player.name);
            } else {
              this.addChat(2, filtered, player.name);
            }
          } catch (_e) {}
        }
      }
      buf.pos = start + length;
    }
    if ((mask & 256 /* SPOTANIM */) !== 0) {
      player.spotanimId = buf.g2();
      const heightDelay = buf.g4();
      player.spotanimHeight = heightDelay >> 16;
      player.spotanimLastCycle = this.loopCycle + (heightDelay & 65535);
      player.spotanimFrame = 0;
      player.spotanimCycle = 0;
      if (player.spotanimLastCycle > this.loopCycle) {
        player.spotanimFrame = -1;
      }
      if (player.spotanimId === 65535) {
        player.spotanimId = -1;
      }
    }
    if ((mask & 512 /* EXACTMOVE */) !== 0) {
      player.exactStartX = buf.g1();
      player.exactStartZ = buf.g1();
      player.exactEndX = buf.g1();
      player.exactEndZ = buf.g1();
      player.exactMoveEnd = buf.g2() + this.loopCycle;
      player.exactMoveStart = buf.g2() + this.loopCycle;
      player.exactMoveFacing = buf.g1();
      player.routeLength = 0;
      player.routeX[0] = player.exactEndX;
      player.routeZ[0] = player.exactEndZ;
    }
  }
  getNpcPos(buf, size) {
    this.entityRemovalCount = 0;
    this.entityUpdateCount = 0;
    this.getNpcPosOldVis(buf, size);
    this.getNpcPosNewVis(buf, size);
    this.getNpcPosExtended(buf, size);
    for (let i = 0;i < this.entityRemovalCount; i++) {
      const index = this.entityRemovalIds[i];
      const npc = this.npc[index];
      if (!npc) {
        continue;
      }
      if (npc.cycle !== this.loopCycle) {
        npc.type = null;
        this.npc[index] = null;
      }
    }
    if (buf.pos !== size) {
      console.error(`${this.loginUser} size mismatch in getnpcpos - pos:${buf.pos} psize:${size}`);
      throw new Error("eek");
    }
    for (let i = 0;i < this.npcCount; i++) {
      if (!this.npc[this.npcIds[i]]) {
        console.error(`${this.loginUser} null entry in npc list - pos:${i} size:${this.npcCount}`);
        throw new Error("eek");
      }
    }
  }
  getNpcPosOldVis(buf, _size) {
    buf.gBitStart();
    const count = buf.gBit(8);
    if (count < this.npcCount) {
      for (let i = count;i < this.npcCount; i++) {
        this.entityRemovalIds[this.entityRemovalCount++] = this.npcIds[i];
      }
    }
    if (count > this.npcCount) {
      console.error(`eek! ${this.loginUser} Too many npcs`);
      throw new Error("eek");
    }
    this.npcCount = 0;
    for (let i = 0;i < count; i++) {
      const index = this.npcIds[i];
      const npc = this.npc[index];
      const info = buf.gBit(1);
      if (info === 0) {
        this.npcIds[this.npcCount++] = index;
        if (npc) {
          npc.cycle = this.loopCycle;
        }
      } else {
        const op = buf.gBit(2);
        if (op === 0) {
          this.npcIds[this.npcCount++] = index;
          if (npc) {
            npc.cycle = this.loopCycle;
          }
          this.entityUpdateIds[this.entityUpdateCount++] = index;
        } else if (op === 1) {
          this.npcIds[this.npcCount++] = index;
          if (npc) {
            npc.cycle = this.loopCycle;
          }
          const walkDir = buf.gBit(3);
          npc?.moveCode(false, walkDir);
          const extendedInfo = buf.gBit(1);
          if (extendedInfo === 1) {
            this.entityUpdateIds[this.entityUpdateCount++] = index;
          }
        } else if (op === 2) {
          this.npcIds[this.npcCount++] = index;
          if (npc) {
            npc.cycle = this.loopCycle;
          }
          const walkDir = buf.gBit(3);
          npc?.moveCode(true, walkDir);
          const runDir = buf.gBit(3);
          npc?.moveCode(true, runDir);
          const extendedInfo = buf.gBit(1);
          if (extendedInfo === 1) {
            this.entityUpdateIds[this.entityUpdateCount++] = index;
          }
        } else if (op === 3) {
          this.entityRemovalIds[this.entityRemovalCount++] = index;
        }
      }
    }
  }
  getNpcPosNewVis(buf, size) {
    while (buf.bitPos + 21 < size * 8) {
      const index = buf.gBit(13);
      if (index === 8191) {
        break;
      }
      if (!this.npc[index]) {
        this.npc[index] = new ClientNpc;
      }
      const npc = this.npc[index];
      this.npcIds[this.npcCount++] = index;
      if (npc) {
        npc.cycle = this.loopCycle;
        npc.type = NpcType.list(buf.gBit(11));
        npc.size = npc.type.size;
        npc.walkanim = npc.type.walkanim;
        npc.walkanim_b = npc.type.walkanim_b;
        npc.walkanim_l = npc.type.walkanim_r;
        npc.walkanim_r = npc.type.walkanim_l;
        npc.readyanim = npc.type.readyanim;
      } else {
        buf.gBit(11);
      }
      let dx = buf.gBit(5);
      if (dx > 15) {
        dx -= 32;
      }
      let dz = buf.gBit(5);
      if (dz > 15) {
        dz -= 32;
      }
      if (this.localPlayer) {
        npc?.teleport(false, this.localPlayer.routeX[0] + dx, this.localPlayer.routeZ[0] + dz);
      }
      const extendedInfo = buf.gBit(1);
      if (extendedInfo === 1) {
        this.entityUpdateIds[this.entityUpdateCount++] = index;
      }
    }
    buf.gBitEnd();
  }
  getNpcPosExtended(buf, _size) {
    for (let i = 0;i < this.entityUpdateCount; i++) {
      const id = this.entityUpdateIds[i];
      const npc = this.npc[id];
      if (!npc) {
        continue;
      }
      const mask = buf.g1();
      if ((mask & 2 /* ANIM */) !== 0) {
        let anim = buf.g2();
        if (anim === 65535) {
          anim = -1;
        }
        if (anim === npc.primaryAnim) {
          npc.primaryAnimLoop = 0;
        }
        const delay = buf.g1();
        if (anim === -1 || npc.primaryAnim === -1 || SeqType.list[anim].priority > SeqType.list[npc.primaryAnim].priority || SeqType.list[npc.primaryAnim].priority === 0) {
          npc.primaryAnim = anim;
          npc.primaryAnimFrame = 0;
          npc.primaryAnimCycle = 0;
          npc.primaryAnimDelay = delay;
          npc.primaryAnimLoop = 0;
        }
      }
      if ((mask & 4 /* FACEENTITY */) !== 0) {
        npc.faceEntity = buf.g2();
        if (npc.faceEntity === 65535) {
          npc.faceEntity = -1;
        }
      }
      if ((mask & 8 /* SAY */) !== 0) {
        npc.chatMessage = buf.gjstr();
        npc.chatTimer = 100;
      }
      if ((mask & 16 /* HITMARK */) !== 0) {
        npc.damageValue = buf.g1();
        npc.damageType = buf.g1();
        npc.combatCycle = this.loopCycle + 400;
        npc.health = buf.g1();
        npc.totalHealth = buf.g1();
      }
      if ((mask & 32 /* CHANGETYPE */) !== 0) {
        npc.type = NpcType.list(buf.g2());
        npc.walkanim = npc.type.walkanim;
        npc.walkanim_b = npc.type.walkanim_b;
        npc.walkanim_l = npc.type.walkanim_r;
        npc.walkanim_r = npc.type.walkanim_l;
        npc.readyanim = npc.type.readyanim;
      }
      if ((mask & 64 /* SPOTANIM */) !== 0) {
        npc.spotanimId = buf.g2();
        const info = buf.g4();
        npc.spotanimHeight = info >> 16;
        npc.spotanimLastCycle = this.loopCycle + (info & 65535);
        npc.spotanimFrame = 0;
        npc.spotanimCycle = 0;
        if (npc.spotanimLastCycle > this.loopCycle) {
          npc.spotanimFrame = -1;
        }
        if (npc.spotanimId === 65535) {
          npc.spotanimId = -1;
        }
      }
      if ((mask & 128 /* FACESQUARE */) !== 0) {
        npc.faceSquareX = buf.g2();
        npc.faceSquareZ = buf.g2();
      }
    }
  }
  async mouseLoop() {
    if (this.objDragArea !== 0) {
      return;
    }
    if (this.isMobile && this.dialogInputOpen && this.insideChatPopupArea()) {
      return;
    }
    let button = this.mouseClickButton;
    if (this.targetMode === 1 && this.mouseClickX >= 520 && this.mouseClickY >= 165 && this.mouseClickX <= 788 && this.mouseClickY <= 230) {
      button = 0;
    }
    if (this.isMenuOpen) {
      if (button === 1) {
        const menuX = this.menuX;
        const menuY = this.menuY;
        const menuWidth = this.menuWidth;
        let clickX = this.mouseClickX;
        let clickY = this.mouseClickY;
        if (this.menuArea === 0) {
          clickX -= 8;
          clickY -= 11;
        } else if (this.menuArea === 1) {
          clickX -= 562;
          clickY -= 231;
        } else if (this.menuArea === 2) {
          clickX -= 22;
          clickY -= 375;
        }
        let option = -1;
        for (let i = 0;i < this.menuNumEntries; i++) {
          const optionY = menuY + (this.menuNumEntries - 1 - i) * 15 + 31;
          if (clickX > menuX && clickX < menuX + menuWidth && clickY > optionY - 13 && clickY < optionY + 3) {
            option = i;
          }
        }
        if (option !== -1) {
          await this.doAction(option);
        }
        this.isMenuOpen = false;
        if (this.menuArea === 1) {
          this.redrawSidebar = true;
        } else if (this.menuArea === 2) {
          this.redrawChatback = true;
        }
      } else {
        let x = this.mouseX;
        let y = this.mouseY;
        if (this.menuArea === 0) {
          x -= 8;
          y -= 11;
        } else if (this.menuArea === 1) {
          x -= 562;
          y -= 231;
        } else if (this.menuArea === 2) {
          x -= 22;
          y -= 375;
        }
        if (x < this.menuX - 10 || x > this.menuX + this.menuWidth + 10 || y < this.menuY - 10 || y > this.menuY + this.menuHeight + 10) {
          this.isMenuOpen = false;
          if (this.menuArea === 1) {
            this.redrawSidebar = true;
          }
          if (this.menuArea === 2) {
            this.redrawChatback = true;
          }
        }
      }
    } else {
      if (button === 1 && this.menuNumEntries > 0) {
        const action = this.menuAction[this.menuNumEntries - 1];
        if (action == 602 || action == 596 || action == 22 || action == 892 || action == 415 || action == 405 || action == 38 || action == 422 || action == 478 || action == 347 || action == 188) {
          const slot = this.menuParamB[this.menuNumEntries - 1];
          const comId = this.menuParamC[this.menuNumEntries - 1];
          const com = IfType.list[comId];
          if (com.objSwap) {
            this.objGrabThreshold = false;
            this.objDragCycles = 0;
            this.objDragComId = comId;
            this.objDragSlot = slot;
            this.objDragArea = 2;
            this.objGrabX = this.mouseClickX;
            this.objGrabY = this.mouseClickY;
            if (IfType.list[comId].layerId === this.mainModalId) {
              this.objDragArea = 1;
            }
            if (IfType.list[comId].layerId === this.chatComId) {
              this.objDragArea = 3;
            }
            return;
          }
        }
      }
      if (button === 1 && (this.oneMouseButton === 1 || this.isAddFriendOption(this.menuNumEntries - 1)) && this.menuNumEntries > 2) {
        button = 2;
      }
      if (button === 1 && this.menuNumEntries > 0) {
        await this.doAction(this.menuNumEntries - 1);
      } else if (button == 2 && this.menuNumEntries > 0) {
        this.openMenu();
      }
    }
  }
  drawMinimenu() {
    const x = this.menuX;
    const y = this.menuY;
    const w = this.menuWidth;
    const h = this.menuHeight;
    const background = 6116423;
    Pix2D.fillRect(x, y, w, h, background);
    Pix2D.fillRect(x + 1, y + 1, w - 2, 16, 0 /* BLACK */);
    Pix2D.drawRect(x + 1, y + 18, w - 2, h - 19, 0 /* BLACK */);
    this.b12?.drawString(x + 3, y + 14, "Choose Option", background);
    let mouseX = this.mouseX;
    let mouseY = this.mouseY;
    if (this.menuArea === 0) {
      mouseX -= 8;
      mouseY -= 11;
    } else if (this.menuArea === 1) {
      mouseX -= 562;
      mouseY -= 231;
    } else if (this.menuArea === 2) {
      mouseX -= 22;
      mouseY -= 375;
    }
    for (let i = 0;i < this.menuNumEntries; i++) {
      const optionY = y + (this.menuNumEntries - 1 - i) * 15 + 31;
      let rgb = 16777215 /* WHITE */;
      if (mouseX > x && mouseX < x + w && mouseY > optionY - 13 && mouseY < optionY + 3) {
        rgb = 16776960 /* YELLOW */;
      }
      this.b12?.drawStringTag(x + 3, optionY, this.menuOption[i], rgb, true);
    }
  }
  drawFeedback() {
    if (this.menuNumEntries < 2 && this.useMode === 0 && this.targetMode === 0) {
      return;
    }
    let tooltip;
    if (this.useMode === 1 && this.menuNumEntries < 2) {
      tooltip = "Use " + this.objSelectedName + " with...";
    } else if (this.targetMode === 1 && this.menuNumEntries < 2) {
      tooltip = this.targetOp + "...";
    } else {
      tooltip = this.menuOption[this.menuNumEntries - 1];
    }
    if (this.menuNumEntries > 2) {
      tooltip = tooltip + "@whi@ / " + (this.menuNumEntries - 2) + " more options";
    }
    this.b12?.drawStringAntiMacro(4, 15, tooltip, 16777215 /* WHITE */, true, this.loopCycle / 1000 | 0);
  }
  openMenu() {
    let width = 0;
    if (this.b12) {
      width = this.b12.stringWid("Choose Option");
      let maxWidth;
      for (let i = 0;i < this.menuNumEntries; i++) {
        maxWidth = this.b12.stringWid(this.menuOption[i]);
        if (maxWidth > width) {
          width = maxWidth;
        }
      }
    }
    width += 8;
    const height = this.menuNumEntries * 15 + 21;
    let x;
    let y;
    if (this.mouseClickX > 8 && this.mouseClickY > 11 && this.mouseClickX < 520 && this.mouseClickY < 345) {
      x = this.mouseClickX - (width / 2 | 0) - 8;
      if (x + width > 512) {
        x = 512 - width;
      }
      if (x < 0) {
        x = 0;
      }
      y = this.mouseClickY - 11;
      if (y + height > 334) {
        y = 334 - height;
      }
      if (y < 0) {
        y = 0;
      }
      this.isMenuOpen = true;
      this.menuArea = 0;
      this.menuX = x;
      this.menuY = y;
      this.menuWidth = width;
      this.menuHeight = this.menuNumEntries * 15 + 22;
    }
    if (this.mouseClickX > 562 && this.mouseClickY > 231 && this.mouseClickX < 752 && this.mouseClickY < 492) {
      x = this.mouseClickX - (width / 2 | 0) - 562;
      if (x < 0) {
        x = 0;
      } else if (x + width > 190) {
        x = 190 - width;
      }
      y = this.mouseClickY - 231;
      if (y < 0) {
        y = 0;
      } else if (y + height > 261) {
        y = 261 - height;
      }
      this.isMenuOpen = true;
      this.menuArea = 1;
      this.menuX = x;
      this.menuY = y;
      this.menuWidth = width;
      this.menuHeight = this.menuNumEntries * 15 + 22;
    }
    if (this.mouseClickX > 22 && this.mouseClickY > 375 && this.mouseClickX < 501 && this.mouseClickY < 471) {
      x = this.mouseClickX - (width / 2 | 0) - 22;
      if (x < 0) {
        x = 0;
      } else if (x + width > 479) {
        x = 479 - width;
      }
      y = this.mouseClickY - 375;
      if (y < 0) {
        y = 0;
      } else if (y + height > 96) {
        y = 96 - height;
      }
      this.isMenuOpen = true;
      this.menuArea = 2;
      this.menuX = x;
      this.menuY = y;
      this.menuWidth = width;
      this.menuHeight = this.menuNumEntries * 15 + 22;
    }
  }
  isAddFriendOption(option) {
    if (option < 0) {
      return false;
    }
    let action = this.menuAction[option];
    if (action >= 2000) {
      action -= 2000;
    }
    return action === 406;
  }
  async doAction(optionId) {
    if (optionId < 0) {
      return;
    }
    if (this.dialogInputOpen) {
      this.dialogInputOpen = false;
      this.redrawChatback = true;
    }
    let action = this.menuAction[optionId];
    const a = this.menuParamA[optionId];
    const b = this.menuParamB[optionId];
    const c = this.menuParamC[optionId];
    if (action >= 2000) {
      action -= 2000;
    }
    if (action === 224 || action === 993 || action === 99 || action === 746 || action === 877) {
      if (this.localPlayer) {
        const success = this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 0, 0, 0, 0, 0, false);
        if (!success) {
          this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 1, 1, 0, 0, 0, false);
        }
        this.crossX = this.mouseClickX;
        this.crossY = this.mouseClickY;
        this.crossMode = 2;
        this.crossCycle = 0;
        if (action === 224) {
          this.out.p1Enc(140 /* OPOBJ1 */);
        }
        if (action === 993) {
          this.out.p1Enc(40 /* OPOBJ2 */);
        }
        if (action === 99) {
          this.out.p1Enc(200 /* OPOBJ3 */);
        }
        if (action === 746) {
          this.out.p1Enc(178 /* OPOBJ4 */);
        }
        if (action === 877) {
          this.out.p1Enc(247 /* OPOBJ5 */);
        }
        this.out.p2(b + this.mapBuildBaseX);
        this.out.p2(c + this.mapBuildBaseZ);
        this.out.p2(a);
      }
    }
    if (action === 1102) {
      const obj = ObjType.list(a);
      let examine;
      if (!obj.desc) {
        examine = "It's a " + obj.name + ".";
      } else {
        examine = obj.desc;
      }
      this.addChat(0, examine, "");
    }
    if (action === 965) {
      if (this.localPlayer) {
        const success = this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 0, 0, 0, 0, 0, false);
        if (!success) {
          this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 1, 1, 0, 0, 0, false);
        }
        this.crossX = this.mouseClickX;
        this.crossY = this.mouseClickY;
        this.crossMode = 2;
        this.crossCycle = 0;
        this.out.p1Enc(138 /* OPOBJT */);
        this.out.p2(b + this.mapBuildBaseX);
        this.out.p2(c + this.mapBuildBaseZ);
        this.out.p2(a);
        this.out.p2(this.targetComId);
      }
    }
    if (action === 217) {
      if (this.localPlayer) {
        const success = this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 0, 0, 0, 0, 0, false);
        if (!success) {
          this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 1, 1, 0, 0, 0, false);
        }
        this.crossX = this.mouseClickX;
        this.crossY = this.mouseClickY;
        this.crossMode = 2;
        this.crossCycle = 0;
        this.out.p1Enc(239 /* OPOBJU */);
        this.out.p2(b + this.mapBuildBaseX);
        this.out.p2(c + this.mapBuildBaseZ);
        this.out.p2(a);
        this.out.p2(this.objComId);
        this.out.p2(this.objSelectedSlot);
        this.out.p2(this.objSelectedComId);
      }
    }
    if (action === 728 || action === 542 || action === 6 || action === 963 || action === 245) {
      const npc = this.npc[a];
      if (npc && this.localPlayer) {
        this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], npc.routeX[0], npc.routeZ[0], 2, 1, 1, 0, 0, 0, false);
        this.crossX = this.mouseClickX;
        this.crossY = this.mouseClickY;
        this.crossMode = 2;
        this.crossCycle = 0;
        if (action === 728) {
          this.out.p1Enc(194 /* OPNPC1 */);
        }
        if (action === 542) {
          this.out.p1Enc(8 /* OPNPC2 */);
        }
        if (action === 6) {
          if ((a & 3) === 0) {
            Client.oplogic2++;
          }
          if (Client.oplogic2 >= 124) {
            this.out.p1Enc(88 /* ANTICHEAT_OPLOGIC2 */);
            this.out.p4(0);
          }
          this.out.p1Enc(27 /* OPNPC3 */);
        }
        if (action === 963) {
          this.out.p1Enc(113 /* OPNPC4 */);
        }
        if (action === 245) {
          if ((a & 3) === 0) {
            Client.oplogic4++;
          }
          if (Client.oplogic4 >= 85) {
            this.out.p1Enc(176 /* ANTICHEAT_OPLOGIC4 */);
            this.out.p2(39596);
          }
          this.out.p1Enc(100 /* OPNPC5 */);
        }
        this.out.p2(a);
      }
    }
    if (action === 1607) {
      const npc = this.npc[a];
      if (npc && npc.type) {
        let examine;
        if (!npc.type.desc) {
          examine = "It's a " + npc.type.name + ".";
        } else {
          examine = npc.type.desc;
        }
        this.addChat(0, examine, "");
      }
    }
    if (action === 265) {
      const npc = this.npc[a];
      if (npc && this.localPlayer) {
        this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], npc.routeX[0], npc.routeZ[0], 2, 1, 1, 0, 0, 0, false);
        this.crossX = this.mouseClickX;
        this.crossY = this.mouseClickY;
        this.crossMode = 2;
        this.crossCycle = 0;
        this.out.p1Enc(134 /* OPNPCT */);
        this.out.p2(a);
        this.out.p2(this.targetComId);
      }
    }
    if (action === 900) {
      const npc = this.npc[a];
      if (npc && this.localPlayer) {
        this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], npc.routeX[0], npc.routeZ[0], 2, 1, 1, 0, 0, 0, false);
        this.crossX = this.mouseClickX;
        this.crossY = this.mouseClickY;
        this.crossMode = 2;
        this.crossCycle = 0;
        this.out.p1Enc(202 /* OPNPCU */);
        this.out.p2(a);
        this.out.p2(this.objComId);
        this.out.p2(this.objSelectedSlot);
        this.out.p2(this.objSelectedComId);
      }
    }
    if (action === 285) {
      this.interactWithLoc(245 /* OPLOC1 */, b, c, a);
    }
    if (action === 504) {
      this.interactWithLoc(172 /* OPLOC2 */, b, c, a);
    }
    if (action === 364) {
      this.interactWithLoc(96 /* OPLOC3 */, b, c, a);
    }
    if (action === 581) {
      if ((a & 3) === 0) {
        Client.oplogic1++;
      }
      if (Client.oplogic1 >= 99) {
        this.out.p1Enc(7 /* ANTICHEAT_OPLOGIC1 */);
        this.out.p4(0);
      }
      this.interactWithLoc(97 /* OPLOC4 */, b, c, a);
    }
    if (action === 1501) {
      Client.oplogic6 += this.mapBuildBaseZ;
      if (Client.oplogic6 >= 92) {
        this.out.p1Enc(66 /* ANTICHEAT_OPLOGIC6 */);
        this.out.p4(0);
      }
      this.interactWithLoc(116 /* OPLOC5 */, b, c, a);
    }
    if (action === 1175) {
      const locId = a >> 14 & 32767;
      const loc = LocType.list(locId);
      let examine;
      if (!loc.desc) {
        examine = "It's a " + loc.name + ".";
      } else {
        examine = loc.desc;
      }
      this.addChat(0, examine, "");
    }
    if (action === 55) {
      if (this.interactWithLoc(9 /* OPLOCT */, b, c, a)) {
        this.out.p2(this.targetComId);
      }
    }
    if (action === 450) {
      if (this.interactWithLoc(75 /* OPLOCU */, b, c, a)) {
        this.out.p2(this.objComId);
        this.out.p2(this.objSelectedSlot);
        this.out.p2(this.objSelectedComId);
      }
    }
    if (action === 1373 || action === 1544 || action === 151 || action === 1101) {
      const player = this.players[a];
      if (player && this.localPlayer) {
        this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], player.routeX[0], player.routeZ[0], 2, 1, 1, 0, 0, 0, false);
        this.crossX = this.mouseClickX;
        this.crossY = this.mouseClickY;
        this.crossMode = 2;
        this.crossCycle = 0;
        if (action === 1101) {
          this.out.p1Enc(164 /* OPPLAYER1 */);
        }
        if (action === 151) {
          Client.oplogic8++;
          if (Client.oplogic8 >= 90) {
            this.out.p1Enc(2 /* ANTICHEAT_OPLOGIC8 */);
            this.out.p2(31114);
          }
          this.out.p1Enc(53 /* OPPLAYER2 */);
        }
        if (action === 1544) {
          this.out.p1Enc(185 /* OPPLAYER3 */);
        }
        if (action === 1373) {
          this.out.p1Enc(206 /* OPPLAYER4 */);
        }
        this.out.p2(a);
      }
    }
    if (action === 903 || action === 363) {
      let option = this.menuOption[optionId];
      const tag = option.indexOf("@whi@");
      if (tag !== -1) {
        option = option.substring(tag + 5).trim();
        const name = JString.toScreenName(JString.toRawUsername(JString.toUserhash(option)));
        let found = false;
        for (let i = 0;i < this.playerCount; i++) {
          const player = this.players[this.playerIds[i]];
          if (player && player.name && player.name.toLowerCase() === name.toLowerCase() && this.localPlayer) {
            this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], player.routeX[0], player.routeZ[0], 2, 1, 1, 0, 0, 0, false);
            if (action === 363) {
              this.out.p1Enc(164 /* OPPLAYER1 */);
            }
            if (action === 903) {
              this.out.p1Enc(206 /* OPPLAYER4 */);
            }
            this.out.p2(this.playerIds[i]);
            found = true;
            break;
          }
        }
        if (!found) {
          this.addChat(0, "Unable to find " + name, "");
        }
      }
    }
    if (action === 651) {
      const player = this.players[a];
      if (player && this.localPlayer) {
        this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], player.routeX[0], player.routeZ[0], 2, 1, 1, 0, 0, 0, false);
        this.crossX = this.mouseClickX;
        this.crossY = this.mouseClickY;
        this.crossMode = 2;
        this.crossCycle = 0;
        this.out.p1Enc(177 /* OPPLAYERT */);
        this.out.p2(a);
        this.out.p2(this.targetComId);
      }
    }
    if (action === 367) {
      const player = this.players[a];
      if (player && this.localPlayer) {
        this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], player.routeX[0], player.routeZ[0], 2, 1, 1, 0, 0, 0, false);
        this.crossX = this.mouseClickX;
        this.crossY = this.mouseClickY;
        this.crossMode = 2;
        this.crossCycle = 0;
        this.out.p1Enc(248 /* OPPLAYERU */);
        this.out.p2(a);
        this.out.p2(this.objComId);
        this.out.p2(this.objSelectedSlot);
        this.out.p2(this.objSelectedComId);
      }
    }
    if (action === 405 || action === 38 || action === 422 || action === 478 || action === 347) {
      if (action === 405) {
        Client.oplogic3 += a;
        if (Client.oplogic3 >= 97) {
          this.out.p1Enc(30 /* ANTICHEAT_OPLOGIC3 */);
          this.out.p3(14953816);
        }
        this.out.p1Enc(195 /* OPHELD1 */);
      }
      if (action === 38) {
        this.out.p1Enc(71 /* OPHELD2 */);
      }
      if (action === 422) {
        this.out.p1Enc(133 /* OPHELD3 */);
      }
      if (action === 478) {
        if ((b & 3) === 0) {
          Client.oplogic5++;
        }
        if (Client.oplogic5 >= 90) {
          this.out.p1Enc(220 /* ANTICHEAT_OPLOGIC5 */);
        }
        this.out.p1Enc(157 /* OPHELD4 */);
      }
      if (action === 347) {
        this.out.p1Enc(211 /* OPHELD5 */);
      }
      this.out.p2(a);
      this.out.p2(b);
      this.out.p2(c);
      this.selectedCycle = 0;
      this.selectedComId = c;
      this.selectedItem = b;
      this.selectedArea = 2;
      if (IfType.list[c].layerId === this.mainModalId) {
        this.selectedArea = 1;
      }
      if (IfType.list[c].layerId === this.chatComId) {
        this.selectedArea = 3;
      }
    }
    if (action === 1773) {
      const obj = ObjType.list(a);
      let examine;
      if (c >= 1e5) {
        examine = c + " x " + obj.name;
      } else if (!obj.desc) {
        examine = "It's a " + obj.name + ".";
      } else {
        examine = obj.desc;
      }
      this.addChat(0, examine, "");
    }
    if (action === 188) {
      this.useMode = 1;
      this.objSelectedSlot = b;
      this.objSelectedComId = c;
      this.objComId = a;
      this.objSelectedName = ObjType.list(a).name;
      this.targetMode = 0;
      return;
    }
    if (action === 930) {
      const com = IfType.list[c];
      this.targetMode = 1;
      this.targetComId = c;
      this.targetMask = com.targetMask;
      this.useMode = 0;
      let prefix = com.targetVerb;
      if (prefix && prefix.indexOf(" ") !== -1) {
        prefix = prefix.substring(0, prefix.indexOf(" "));
      }
      let suffix = com.targetVerb;
      if (suffix && suffix.indexOf(" ") !== -1) {
        suffix = suffix.substring(suffix.indexOf(" ") + 1);
      }
      this.targetOp = prefix + " " + com.targetBase + " " + suffix;
      if (this.targetMask === 16) {
        this.redrawSidebar = true;
        this.sideTab = 3;
        this.redrawSideicons = true;
      }
      return;
    }
    if (action === 391) {
      this.out.p1Enc(48 /* OPHELDT */);
      this.out.p2(a);
      this.out.p2(b);
      this.out.p2(c);
      this.out.p2(this.targetComId);
      this.selectedCycle = 0;
      this.selectedComId = c;
      this.selectedItem = b;
      this.selectedArea = 2;
      if (IfType.list[c].layerId === this.mainModalId) {
        this.selectedArea = 1;
      }
      if (IfType.list[c].layerId === this.chatComId) {
        this.selectedArea = 3;
      }
    }
    if (action === 881) {
      this.out.p1Enc(130 /* OPHELDU */);
      this.out.p2(a);
      this.out.p2(b);
      this.out.p2(c);
      this.out.p2(this.objComId);
      this.out.p2(this.objSelectedSlot);
      this.out.p2(this.objSelectedComId);
      this.selectedCycle = 0;
      this.selectedComId = c;
      this.selectedItem = b;
      this.selectedArea = 2;
      if (IfType.list[c].layerId === this.mainModalId) {
        this.selectedArea = 1;
      }
      if (IfType.list[c].layerId === this.chatComId) {
        this.selectedArea = 3;
      }
    }
    if (action === 602 || action === 596 || action === 22 || action === 892 || action === 415) {
      if (action === 602) {
        this.out.p1Enc(31 /* INV_BUTTON1 */);
      }
      if (action === 596) {
        this.out.p1Enc(59 /* INV_BUTTON2 */);
      }
      if (action === 22) {
        this.out.p1Enc(212 /* INV_BUTTON3 */);
      }
      if (action === 892) {
        if ((b & 3) === 0) {
          Client.oplogic9++;
        }
        if (Client.oplogic9 >= 130) {
          this.out.p1Enc(238 /* ANTICHEAT_OPLOGIC9 */);
          this.out.p1(177);
        }
        this.out.p1Enc(38 /* INV_BUTTON4 */);
      }
      if (action === 415) {
        if ((c & 3) === 0) {
          Client.oplogic7++;
        }
        if (Client.oplogic7 >= 55) {
          this.out.p1Enc(17 /* ANTICHEAT_OPLOGIC7 */);
          this.out.p4(0);
        }
        this.out.p1Enc(6 /* INV_BUTTON5 */);
      }
      this.out.p2(a);
      this.out.p2(b);
      this.out.p2(c);
      this.selectedCycle = 0;
      this.selectedComId = c;
      this.selectedItem = b;
      this.selectedArea = 2;
      if (IfType.list[c].layerId === this.mainModalId) {
        this.selectedArea = 1;
      }
      if (IfType.list[c].layerId === this.chatComId) {
        this.selectedArea = 3;
      }
    }
    if (action === 465) {
      this.out.p1Enc(155 /* IF_BUTTON */);
      this.out.p2(c);
      const com = IfType.list[c];
      if (com.scripts && com.scripts[0] && com.scripts[0][0] === 5) {
        const varp = com.scripts[0][1];
        this.var[varp] = 1 - this.var[varp];
        await this.clientVar(varp);
        this.redrawSidebar = true;
      }
    }
    if (action === 951) {
      const com = IfType.list[c];
      let notify = true;
      if (com.clientCode > 0) {
        notify = this.clientButton(com);
      }
      if (notify) {
        this.out.p1Enc(155 /* IF_BUTTON */);
        this.out.p2(c);
      }
    }
    if (action === 960) {
      this.out.p1Enc(155 /* IF_BUTTON */);
      this.out.p2(c);
      const com = IfType.list[c];
      if (com.scripts && com.scripts[0] && com.scripts[0][0] === 5) {
        const varp = com.scripts[0][1];
        if (com.scriptOperand && this.var[varp] !== com.scriptOperand[0]) {
          this.var[varp] = com.scriptOperand[0];
          await this.clientVar(varp);
          this.redrawSidebar = true;
        }
      }
    }
    if (action === 44) {
      if (!this.resumedPauseButton) {
        this.out.p1Enc(235 /* RESUME_PAUSEBUTTON */);
        this.out.p2(c);
        this.resumedPauseButton = true;
      }
    }
    if (action === 947) {
      this.closeModal();
    }
    if (action === 34) {
      const option = this.menuOption[optionId];
      const tag = option.indexOf("@whi@");
      if (tag !== -1) {
        this.closeModal();
        this.reportAbuseInput = option.substring(tag + 5).trim();
        this.reportAbuseMuteOption = false;
        for (let i = 0;i < IfType.list.length; i++) {
          if (IfType.list[i] && IfType.list[i].clientCode === 600 /* CC_REPORT_INPUT */) {
            this.reportAbuseComId = this.mainModalId = IfType.list[i].layerId;
            break;
          }
        }
      }
    }
    if (action === 660) {
      if (this.isMenuOpen) {
        this.world?.updateMousePicking(b - 8, c - 11);
      } else {
        this.world?.updateMousePicking(this.mouseClickX - 8, this.mouseClickY - 11);
      }
    }
    if (action === 406 || action === 436 || action === 557 || action === 556) {
      const option = this.menuOption[optionId];
      const tag = option.indexOf("@whi@");
      if (tag !== -1) {
        const username = JString.toUserhash(option.substring(tag + 5).trim());
        if (action === 406) {
          this.addFriend(username);
        } else if (action === 436) {
          this.addIgnore(username);
        } else if (action === 557) {
          this.delFriend(username);
        } else if (action === 556) {
          this.delIgnore(username);
        }
      }
    }
    if (action === 679) {
      const option = this.menuOption[optionId];
      const tag = option.indexOf("@whi@");
      if (tag !== -1) {
        const userhash = JString.toUserhash(option.substring(tag + 5).trim());
        let friend = -1;
        for (let i = 0;i < this.friendCount; i++) {
          if (this.friendUserhash[i] === userhash) {
            friend = i;
            break;
          }
        }
        if (friend !== -1 && this.friendNodeId[friend] > 0) {
          this.redrawChatback = true;
          this.dialogInputOpen = false;
          this.socialInputOpen = true;
          this.socialInput = "";
          this.socialInputType = 3;
          this.socialUserhash = this.friendUserhash[friend];
          this.socialInputHeader = "Enter message to send to " + this.friendUsername[friend];
        }
      }
    }
    this.useMode = 0;
    this.targetMode = 0;
  }
  addWorldOptions() {
    if (this.useMode === 0 && this.targetMode === 0) {
      this.menuOption[this.menuNumEntries] = "Walk here";
      this.menuAction[this.menuNumEntries] = 660;
      this.menuParamB[this.menuNumEntries] = this.mouseX;
      this.menuParamC[this.menuNumEntries] = this.mouseY;
      this.menuNumEntries++;
    }
    let lastTypecode = -1;
    for (let picked = 0;picked < Model.pickedCount; picked++) {
      const typecode = Model.pickedEntityTypecode[picked];
      const x = typecode & 127;
      const z = typecode >> 7 & 127;
      const entityType = typecode >> 29 & 3;
      const typeId = typecode >> 14 & 32767;
      if (typecode === lastTypecode) {
        continue;
      }
      lastTypecode = typecode;
      if (entityType === 2 && this.world && this.world.typeCode2(this.minusedlevel, x, z, typecode) >= 0) {
        const loc = LocType.list(typeId);
        if (this.useMode === 1) {
          this.menuOption[this.menuNumEntries] = "Use " + this.objSelectedName + " with @cya@" + loc.name;
          this.menuAction[this.menuNumEntries] = 450;
          this.menuParamA[this.menuNumEntries] = typecode;
          this.menuParamB[this.menuNumEntries] = x;
          this.menuParamC[this.menuNumEntries] = z;
          this.menuNumEntries++;
        } else if (this.targetMode === 1) {
          if ((this.targetMask & 4) === 4) {
            this.menuOption[this.menuNumEntries] = this.targetOp + " @cya@" + loc.name;
            this.menuAction[this.menuNumEntries] = 55;
            this.menuParamA[this.menuNumEntries] = typecode;
            this.menuParamB[this.menuNumEntries] = x;
            this.menuParamC[this.menuNumEntries] = z;
            this.menuNumEntries++;
          }
        } else {
          if (loc.op) {
            for (let i = 4;i >= 0; i--) {
              if (loc.op[i] === null) {
                continue;
              }
              this.menuOption[this.menuNumEntries] = loc.op[i] + " @cya@" + loc.name;
              if (i === 0) {
                this.menuAction[this.menuNumEntries] = 285;
              } else if (i === 1) {
                this.menuAction[this.menuNumEntries] = 504;
              } else if (i === 2) {
                this.menuAction[this.menuNumEntries] = 364;
              } else if (i === 3) {
                this.menuAction[this.menuNumEntries] = 581;
              } else if (i === 4) {
                this.menuAction[this.menuNumEntries] = 1501;
              }
              this.menuParamA[this.menuNumEntries] = typecode;
              this.menuParamB[this.menuNumEntries] = x;
              this.menuParamC[this.menuNumEntries] = z;
              this.menuNumEntries++;
            }
          }
          this.menuOption[this.menuNumEntries] = "Examine @cya@" + loc.name;
          this.menuAction[this.menuNumEntries] = 1175;
          this.menuParamA[this.menuNumEntries] = typecode;
          this.menuParamB[this.menuNumEntries] = x;
          this.menuParamC[this.menuNumEntries] = z;
          this.menuNumEntries++;
        }
      } else if (entityType === 1) {
        const npc = this.npc[typeId];
        if (npc && npc.type && npc.type.size === 1 && (npc.x & 127) === 64 && (npc.z & 127) === 64) {
          for (let i = 0;i < this.npcCount; i++) {
            const other = this.npc[this.npcIds[i]];
            if (other && other !== npc && other.type && other.type.size === 1 && other.x === npc.x && other.z === npc.z) {
              this.addNpcOptions(other.type, this.npcIds[i], x, z);
            }
          }
        }
        if (npc && npc.type) {
          this.addNpcOptions(npc.type, typeId, x, z);
        }
      } else if (entityType === 0) {
        const player = this.players[typeId];
        if (player && (player.x & 127) === 64 && (player.z & 127) === 64) {
          for (let i = 0;i < this.npcCount; i++) {
            const other = this.npc[this.npcIds[i]];
            if (other && other.type && other.type.size === 1 && other.x === player.x && other.z === player.z) {
              this.addNpcOptions(other.type, this.npcIds[i], x, z);
            }
          }
          for (let i = 0;i < this.playerCount; i++) {
            const other = this.players[this.playerIds[i]];
            if (other && other !== player && other.x === player.x && other.z === player.z) {
              this.addPlayerOptions(other, this.playerIds[i], x, z);
            }
          }
        }
        if (player) {
          this.addPlayerOptions(player, typeId, x, z);
        }
      } else if (entityType === 3) {
        const objs = this.groundObj[this.minusedlevel][x][z];
        if (!objs) {
          continue;
        }
        for (let obj = objs.tail();obj !== null; obj = objs.prev()) {
          const type = ObjType.list(obj.id);
          if (this.useMode === 1) {
            this.menuOption[this.menuNumEntries] = "Use " + this.objSelectedName + " with @lre@" + type.name;
            this.menuAction[this.menuNumEntries] = 217;
            this.menuParamA[this.menuNumEntries] = obj.id;
            this.menuParamB[this.menuNumEntries] = x;
            this.menuParamC[this.menuNumEntries] = z;
            this.menuNumEntries++;
          } else if (this.targetMode === 1) {
            if ((this.targetMask & 1) === 1) {
              this.menuOption[this.menuNumEntries] = this.targetOp + " @lre@" + type.name;
              this.menuAction[this.menuNumEntries] = 965;
              this.menuParamA[this.menuNumEntries] = obj.id;
              this.menuParamB[this.menuNumEntries] = x;
              this.menuParamC[this.menuNumEntries] = z;
              this.menuNumEntries++;
            }
          } else {
            for (let op = 4;op >= 0; op--) {
              if (type.op && type.op[op]) {
                this.menuOption[this.menuNumEntries] = type.op[op] + " @lre@" + type.name;
                if (op === 0) {
                  this.menuAction[this.menuNumEntries] = 224;
                } else if (op === 1) {
                  this.menuAction[this.menuNumEntries] = 993;
                } else if (op === 2) {
                  this.menuAction[this.menuNumEntries] = 99;
                } else if (op === 3) {
                  this.menuAction[this.menuNumEntries] = 746;
                } else if (op === 4) {
                  this.menuAction[this.menuNumEntries] = 877;
                }
                this.menuParamA[this.menuNumEntries] = obj.id;
                this.menuParamB[this.menuNumEntries] = x;
                this.menuParamC[this.menuNumEntries] = z;
                this.menuNumEntries++;
              } else if (op === 2) {
                this.menuOption[this.menuNumEntries] = "Take @lre@" + type.name;
                this.menuAction[this.menuNumEntries] = 99;
                this.menuParamA[this.menuNumEntries] = obj.id;
                this.menuParamB[this.menuNumEntries] = x;
                this.menuParamC[this.menuNumEntries] = z;
                this.menuNumEntries++;
              }
            }
            this.menuOption[this.menuNumEntries] = "Examine @lre@" + type.name;
            this.menuAction[this.menuNumEntries] = 1102;
            this.menuParamA[this.menuNumEntries] = obj.id;
            this.menuParamB[this.menuNumEntries] = x;
            this.menuParamC[this.menuNumEntries] = z;
            this.menuNumEntries++;
          }
        }
      }
    }
  }
  addNpcOptions(npc, a, b, c) {
    if (this.menuNumEntries >= 400) {
      return;
    }
    let tooltip = npc.name;
    if (npc.vislevel !== 0 && this.localPlayer) {
      tooltip = tooltip + this.combatColourCode(this.localPlayer.combatLevel, npc.vislevel) + " (level-" + npc.vislevel + ")";
    }
    if (this.useMode === 1) {
      this.menuOption[this.menuNumEntries] = "Use " + this.objSelectedName + " with @yel@" + tooltip;
      this.menuAction[this.menuNumEntries] = 900;
      this.menuParamA[this.menuNumEntries] = a;
      this.menuParamB[this.menuNumEntries] = b;
      this.menuParamC[this.menuNumEntries] = c;
      this.menuNumEntries++;
    } else if (this.targetMode === 1) {
      if ((this.targetMask & 2) === 2) {
        this.menuOption[this.menuNumEntries] = this.targetOp + " @yel@" + tooltip;
        this.menuAction[this.menuNumEntries] = 265;
        this.menuParamA[this.menuNumEntries] = a;
        this.menuParamB[this.menuNumEntries] = b;
        this.menuParamC[this.menuNumEntries] = c;
        this.menuNumEntries++;
      }
    } else {
      if (npc.op) {
        for (let i = 4;i >= 0; i--) {
          if (npc.op[i] === null || npc.op[i]?.toLowerCase() === "attack") {
            continue;
          }
          this.menuOption[this.menuNumEntries] = npc.op[i] + " @yel@" + tooltip;
          if (i === 0) {
            this.menuAction[this.menuNumEntries] = 728;
          } else if (i === 1) {
            this.menuAction[this.menuNumEntries] = 542;
          } else if (i === 2) {
            this.menuAction[this.menuNumEntries] = 6;
          } else if (i === 3) {
            this.menuAction[this.menuNumEntries] = 963;
          } else if (i === 4) {
            this.menuAction[this.menuNumEntries] = 245;
          }
          this.menuParamA[this.menuNumEntries] = a;
          this.menuParamB[this.menuNumEntries] = b;
          this.menuParamC[this.menuNumEntries] = c;
          this.menuNumEntries++;
        }
      }
      if (npc.op) {
        for (let i = 4;i >= 0; i--) {
          if (npc.op[i] === null || npc.op[i]?.toLowerCase() !== "attack") {
            continue;
          }
          let priority = 0;
          if (this.localPlayer && npc.vislevel > this.localPlayer.combatLevel) {
            priority = 2000;
          }
          this.menuOption[this.menuNumEntries] = npc.op[i] + " @yel@" + tooltip;
          if (i === 0) {
            this.menuAction[this.menuNumEntries] = priority + 728;
          } else if (i === 1) {
            this.menuAction[this.menuNumEntries] = priority + 542;
          } else if (i === 2) {
            this.menuAction[this.menuNumEntries] = priority + 6;
          } else if (i === 3) {
            this.menuAction[this.menuNumEntries] = priority + 963;
          } else if (i === 4) {
            this.menuAction[this.menuNumEntries] = priority + 245;
          }
          this.menuParamA[this.menuNumEntries] = a;
          this.menuParamB[this.menuNumEntries] = b;
          this.menuParamC[this.menuNumEntries] = c;
          this.menuNumEntries++;
        }
      }
      this.menuOption[this.menuNumEntries] = "Examine @yel@" + tooltip;
      this.menuAction[this.menuNumEntries] = 1607;
      this.menuParamA[this.menuNumEntries] = a;
      this.menuParamB[this.menuNumEntries] = b;
      this.menuParamC[this.menuNumEntries] = c;
      this.menuNumEntries++;
    }
  }
  addPlayerOptions(player, a, b, c) {
    if (player === this.localPlayer || this.menuNumEntries >= 400) {
      return;
    }
    let tooltip = null;
    if (this.localPlayer) {
      tooltip = player.name + this.combatColourCode(this.localPlayer.combatLevel, player.combatLevel) + " (level-" + player.combatLevel + ")";
    }
    if (this.useMode === 1) {
      this.menuOption[this.menuNumEntries] = "Use " + this.objSelectedName + " with @whi@" + tooltip;
      this.menuAction[this.menuNumEntries] = 367;
      this.menuParamA[this.menuNumEntries] = a;
      this.menuParamB[this.menuNumEntries] = b;
      this.menuParamC[this.menuNumEntries] = c;
      this.menuNumEntries++;
    } else if (this.targetMode === 1) {
      if ((this.targetMask & 8) === 8) {
        this.menuOption[this.menuNumEntries] = this.targetOp + " @whi@" + tooltip;
        this.menuAction[this.menuNumEntries] = 651;
        this.menuParamA[this.menuNumEntries] = a;
        this.menuParamB[this.menuNumEntries] = b;
        this.menuParamC[this.menuNumEntries] = c;
        this.menuNumEntries++;
      }
    } else {
      this.menuOption[this.menuNumEntries] = "Follow @whi@" + tooltip;
      this.menuAction[this.menuNumEntries] = 1544;
      this.menuParamA[this.menuNumEntries] = a;
      this.menuParamB[this.menuNumEntries] = b;
      this.menuParamC[this.menuNumEntries] = c;
      this.menuNumEntries++;
      if (this.chatDisabled === 0) {
        this.menuOption[this.menuNumEntries] = "Trade with @whi@" + tooltip;
        this.menuAction[this.menuNumEntries] = 1373;
        this.menuParamA[this.menuNumEntries] = a;
        this.menuParamB[this.menuNumEntries] = b;
        this.menuParamC[this.menuNumEntries] = c;
        this.menuNumEntries++;
      }
      if (this.wildernessLevel > 0) {
        this.menuOption[this.menuNumEntries] = "Attack @whi@" + tooltip;
        if (this.localPlayer && this.localPlayer.combatLevel >= player.combatLevel) {
          this.menuAction[this.menuNumEntries] = 151;
        } else {
          this.menuAction[this.menuNumEntries] = 2151;
        }
        this.menuParamA[this.menuNumEntries] = a;
        this.menuParamB[this.menuNumEntries] = b;
        this.menuParamC[this.menuNumEntries] = c;
        this.menuNumEntries++;
      }
      if (this.worldLocationState === 1) {
        this.menuOption[this.menuNumEntries] = "Fight @whi@" + tooltip;
        this.menuAction[this.menuNumEntries] = 151;
        this.menuParamA[this.menuNumEntries] = a;
        this.menuParamB[this.menuNumEntries] = b;
        this.menuParamC[this.menuNumEntries] = c;
        this.menuNumEntries++;
      }
      if (this.worldLocationState === 2) {
        this.menuOption[this.menuNumEntries] = "Duel-with @whi@" + tooltip;
        this.menuAction[this.menuNumEntries] = 1101;
        this.menuParamA[this.menuNumEntries] = a;
        this.menuParamB[this.menuNumEntries] = b;
        this.menuParamC[this.menuNumEntries] = c;
        this.menuNumEntries++;
      }
    }
    for (let i = 0;i < this.menuNumEntries; i++) {
      if (this.menuAction[i] === 660) {
        this.menuOption[i] = "Walk here @whi@" + tooltip;
        break;
      }
    }
  }
  addComponentOptions(com, mouseX, mouseY, x, y, scrollPosition) {
    if (com.type !== 0 || !com.children || com.hide || mouseX < x || mouseY < y || mouseX > x + com.width || mouseY > y + com.height || !com.childX || !com.childY) {
      return;
    }
    const children = com.children.length;
    for (let i = 0;i < children; i++) {
      let childX = com.childX[i] + x;
      let childY = com.childY[i] + y - scrollPosition;
      const child = IfType.list[com.children[i]];
      childX += child.x;
      childY += child.y;
      if ((child.overLayerId >= 0 || child.colourOver !== 0) && mouseX >= childX && mouseY >= childY && mouseX < childX + child.width && mouseY < childY + child.height) {
        if (child.overLayerId >= 0) {
          this.lastOverComId = child.overLayerId;
        } else {
          this.lastOverComId = child.id;
        }
      }
      if (child.type === 0) {
        this.addComponentOptions(child, mouseX, mouseY, childX, childY, child.scrollPos);
        if (child.scrollHeight > child.height) {
          this.doScrollbar(mouseX, mouseY, child.scrollHeight, child.height, true, childX + child.width, childY, child);
        }
      } else if (child.type === 2) {
        let slot = 0;
        for (let row = 0;row < child.height; row++) {
          for (let col = 0;col < child.width; col++) {
            let slotX = childX + col * (child.marginX + 32);
            let slotY = childY + row * (child.marginY + 32);
            if (slot < 20 && child.invBackgroundX && child.invBackgroundY) {
              slotX += child.invBackgroundX[slot];
              slotY += child.invBackgroundY[slot];
            }
            if (mouseX < slotX || mouseY < slotY || mouseX >= slotX + 32 || mouseY >= slotY + 32) {
              slot++;
              continue;
            }
            this.hoveredSlot = slot;
            this.hoveredSlotComId = child.id;
            if (!child.linkObjType || child.linkObjType[slot] <= 0) {
              slot++;
              continue;
            }
            const obj = ObjType.list(child.linkObjType[slot] - 1);
            if (this.useMode === 1 && child.objOps) {
              if (child.id !== this.objSelectedComId || slot !== this.objSelectedSlot) {
                this.menuOption[this.menuNumEntries] = "Use " + this.objSelectedName + " with @lre@" + obj.name;
                this.menuAction[this.menuNumEntries] = 881;
                this.menuParamA[this.menuNumEntries] = obj.id;
                this.menuParamB[this.menuNumEntries] = slot;
                this.menuParamC[this.menuNumEntries] = child.id;
                this.menuNumEntries++;
              }
            } else if (this.targetMode === 1 && child.objOps) {
              if ((this.targetMask & 16) === 16) {
                this.menuOption[this.menuNumEntries] = this.targetOp + " @lre@" + obj.name;
                this.menuAction[this.menuNumEntries] = 391;
                this.menuParamA[this.menuNumEntries] = obj.id;
                this.menuParamB[this.menuNumEntries] = slot;
                this.menuParamC[this.menuNumEntries] = child.id;
                this.menuNumEntries++;
              }
            } else {
              if (child.objOps) {
                for (let op = 4;op >= 3; op--) {
                  if (obj.iop && obj.iop[op]) {
                    this.menuOption[this.menuNumEntries] = obj.iop[op] + " @lre@" + obj.name;
                    if (op === 3) {
                      this.menuAction[this.menuNumEntries] = 478;
                    } else if (op === 4) {
                      this.menuAction[this.menuNumEntries] = 347;
                    }
                    this.menuParamA[this.menuNumEntries] = obj.id;
                    this.menuParamB[this.menuNumEntries] = slot;
                    this.menuParamC[this.menuNumEntries] = child.id;
                    this.menuNumEntries++;
                  } else if (op === 4) {
                    this.menuOption[this.menuNumEntries] = "Drop @lre@" + obj.name;
                    this.menuAction[this.menuNumEntries] = 347;
                    this.menuParamA[this.menuNumEntries] = obj.id;
                    this.menuParamB[this.menuNumEntries] = slot;
                    this.menuParamC[this.menuNumEntries] = child.id;
                    this.menuNumEntries++;
                  }
                }
              }
              if (child.objUse) {
                this.menuOption[this.menuNumEntries] = "Use @lre@" + obj.name;
                this.menuAction[this.menuNumEntries] = 188;
                this.menuParamA[this.menuNumEntries] = obj.id;
                this.menuParamB[this.menuNumEntries] = slot;
                this.menuParamC[this.menuNumEntries] = child.id;
                this.menuNumEntries++;
              }
              if (child.objOps && obj.iop) {
                for (let op = 2;op >= 0; op--) {
                  if (obj.iop[op]) {
                    this.menuOption[this.menuNumEntries] = obj.iop[op] + " @lre@" + obj.name;
                    if (op === 0) {
                      this.menuAction[this.menuNumEntries] = 405;
                    } else if (op === 1) {
                      this.menuAction[this.menuNumEntries] = 38;
                    } else if (op === 2) {
                      this.menuAction[this.menuNumEntries] = 422;
                    }
                    this.menuParamA[this.menuNumEntries] = obj.id;
                    this.menuParamB[this.menuNumEntries] = slot;
                    this.menuParamC[this.menuNumEntries] = child.id;
                    this.menuNumEntries++;
                  }
                }
              }
              if (child.iop) {
                for (let op = 4;op >= 0; op--) {
                  if (child.iop[op]) {
                    this.menuOption[this.menuNumEntries] = child.iop[op] + " @lre@" + obj.name;
                    if (op === 0) {
                      this.menuAction[this.menuNumEntries] = 602;
                    } else if (op === 1) {
                      this.menuAction[this.menuNumEntries] = 596;
                    } else if (op === 2) {
                      this.menuAction[this.menuNumEntries] = 22;
                    } else if (op === 3) {
                      this.menuAction[this.menuNumEntries] = 892;
                    } else if (op === 4) {
                      this.menuAction[this.menuNumEntries] = 415;
                    }
                    this.menuParamA[this.menuNumEntries] = obj.id;
                    this.menuParamB[this.menuNumEntries] = slot;
                    this.menuParamC[this.menuNumEntries] = child.id;
                    this.menuNumEntries++;
                  }
                }
              }
              this.menuOption[this.menuNumEntries] = "Examine @lre@" + obj.name;
              this.menuAction[this.menuNumEntries] = 1773;
              this.menuParamA[this.menuNumEntries] = obj.id;
              if (child.linkObjNumber) {
                this.menuParamC[this.menuNumEntries] = child.linkObjNumber[slot];
              }
              this.menuNumEntries++;
            }
            slot++;
          }
        }
      } else if (mouseX >= childX && mouseY >= childY && mouseX < childX + child.width && mouseY < childY + child.height) {
        if (child.buttonType === 1 /* BUTTON_OK */) {
          let override = false;
          if (child.clientCode !== 0) {
            override = this.addSocialOptions(child);
          }
          if (!override && child.buttonText) {
            this.menuOption[this.menuNumEntries] = child.buttonText;
            this.menuAction[this.menuNumEntries] = 951;
            this.menuParamC[this.menuNumEntries] = child.id;
            this.menuNumEntries++;
          }
        } else if (child.buttonType === 2 /* BUTTON_TARGET */ && this.targetMode === 0) {
          let prefix = child.targetVerb;
          if (prefix && prefix.indexOf(" ") !== -1) {
            prefix = prefix.substring(0, prefix.indexOf(" "));
          }
          this.menuOption[this.menuNumEntries] = prefix + " @gre@" + child.targetBase;
          this.menuAction[this.menuNumEntries] = 930;
          this.menuParamC[this.menuNumEntries] = child.id;
          this.menuNumEntries++;
        } else if (child.buttonType === 3 /* BUTTON_CLOSE */) {
          this.menuOption[this.menuNumEntries] = "Close";
          this.menuAction[this.menuNumEntries] = 947;
          this.menuParamC[this.menuNumEntries] = child.id;
          this.menuNumEntries++;
        } else if (child.buttonType === 4 /* BUTTON_TOGGLE */ && child.buttonText) {
          this.menuOption[this.menuNumEntries] = child.buttonText;
          this.menuAction[this.menuNumEntries] = 465;
          this.menuParamC[this.menuNumEntries] = child.id;
          this.menuNumEntries++;
        } else if (child.buttonType === 5 /* BUTTON_SELECT */ && child.buttonText) {
          this.menuOption[this.menuNumEntries] = child.buttonText;
          this.menuAction[this.menuNumEntries] = 960;
          this.menuParamC[this.menuNumEntries] = child.id;
          this.menuNumEntries++;
        } else if (child.buttonType === 6 /* BUTTON_CONTINUE */ && !this.resumedPauseButton && child.buttonText) {
          this.menuOption[this.menuNumEntries] = child.buttonText;
          this.menuAction[this.menuNumEntries] = 44;
          this.menuParamC[this.menuNumEntries] = child.id;
          this.menuNumEntries++;
        }
      }
    }
  }
  addSocialOptions(component) {
    let clientCode = component.clientCode;
    if (clientCode >= 1 /* CC_FRIENDS_START */ && clientCode <= 200 /* CC_FRIENDS_UPDATE_END */) {
      if (clientCode >= 101 /* CC_FRIENDS_UPDATE_START */) {
        clientCode -= 101 /* CC_FRIENDS_UPDATE_START */;
      } else {
        clientCode--;
      }
      this.menuOption[this.menuNumEntries] = "Remove @whi@" + this.friendUsername[clientCode];
      this.menuAction[this.menuNumEntries] = 557;
      this.menuNumEntries++;
      this.menuOption[this.menuNumEntries] = "Message @whi@" + this.friendUsername[clientCode];
      this.menuAction[this.menuNumEntries] = 679;
      this.menuNumEntries++;
      return true;
    } else if (clientCode >= 401 /* CC_IGNORES_START */ && clientCode <= 500 /* CC_IGNORES_END */) {
      this.menuOption[this.menuNumEntries] = "Remove @whi@" + component.text;
      this.menuAction[this.menuNumEntries] = 556;
      this.menuNumEntries++;
      return true;
    }
    return false;
  }
  combatColourCode(viewerLevel, otherLevel) {
    const diff = viewerLevel - otherLevel;
    if (diff < -9) {
      return "@red@";
    } else if (diff < -6) {
      return "@or3@";
    } else if (diff < -3) {
      return "@or2@";
    } else if (diff < 0) {
      return "@or1@";
    } else if (diff > 9) {
      return "@gre@";
    } else if (diff > 6) {
      return "@gr3@";
    } else if (diff > 3) {
      return "@gr2@";
    } else if (diff > 0) {
      return "@gr1@";
    } else {
      return "@yel@";
    }
  }
  drawInterface(com, x, y, scrollY) {
    if (com.type !== 0 || !com.children || com.hide && this.overMainComId !== com.id && this.overSideComId !== com.id && this.overChatComId !== com.id) {
      return;
    }
    const left = Pix2D.clipMinX;
    const top = Pix2D.clipMinY;
    const right = Pix2D.clipMaxX;
    const bottom = Pix2D.clipMaxY;
    Pix2D.setClipping(x, y, x + com.width, y + com.height);
    const children = com.children.length;
    for (let i = 0;i < children; i++) {
      if (!com.childX || !com.childY) {
        continue;
      }
      let childX = com.childX[i] + x;
      let childY = com.childY[i] + y - scrollY;
      const child = IfType.list[com.children[i]];
      childX += child.x;
      childY += child.y;
      if (child.clientCode > 0) {
        this.clientComponent(child);
      }
      if (child.type === 0 /* TYPE_LAYER */) {
        if (child.scrollPos > child.scrollHeight - child.height) {
          child.scrollPos = child.scrollHeight - child.height;
        }
        if (child.scrollPos < 0) {
          child.scrollPos = 0;
        }
        this.drawInterface(child, childX, childY, child.scrollPos);
        if (child.scrollHeight > child.height) {
          this.drawScrollbar(childX + child.width, childY, child.scrollPos, child.scrollHeight, child.height);
        }
      } else if (child.type === 2 /* TYPE_INV */) {
        let slot = 0;
        for (let row = 0;row < child.height; row++) {
          for (let col = 0;col < child.width; col++) {
            if (!child.invBackgroundX || !child.invBackgroundY || !child.linkObjType || !child.linkObjNumber) {
              continue;
            }
            let slotX = childX + col * (child.marginX + 32);
            let slotY = childY + row * (child.marginY + 32);
            if (slot < 20) {
              slotX += child.invBackgroundX[slot];
              slotY += child.invBackgroundY[slot];
            }
            if (child.linkObjType[slot] > 0) {
              let dx = 0;
              let dy = 0;
              const id = child.linkObjType[slot] - 1;
              if (slotX >= -32 && slotX <= 512 && slotY >= -32 && slotY <= 334 || this.objDragArea !== 0 && this.objDragSlot === slot) {
                const icon = ObjType.getSprite(id, child.linkObjNumber[slot]);
                if (this.objDragArea !== 0 && this.objDragSlot === slot && this.objDragComId === child.id) {
                  dx = this.mouseX - this.objGrabX;
                  dy = this.mouseY - this.objGrabY;
                  if (dx < 5 && dx > -5) {
                    dx = 0;
                  }
                  if (dy < 5 && dy > -5) {
                    dy = 0;
                  }
                  if (this.objDragCycles < 5) {
                    dx = 0;
                    dy = 0;
                  }
                  icon.transPlotSprite(128, slotX + dx, slotY + dy);
                } else if (this.selectedArea !== 0 && this.selectedItem === slot && this.selectedComId === child.id) {
                  icon.transPlotSprite(128, slotX, slotY);
                } else {
                  icon.plotSprite(slotX, slotY);
                }
                if (icon.owi === 33 || child.linkObjNumber[slot] !== 1) {
                  const count = child.linkObjNumber[slot];
                  this.p11?.drawString(slotX + dx + 1, slotY + 10 + dy, this.invNumber(count), 0 /* BLACK */);
                  this.p11?.drawString(slotX + dx, slotY + 9 + dy, this.invNumber(count), 16776960 /* YELLOW */);
                }
              }
            } else if (child.invBackground && slot < 20) {
              const image = child.invBackground[slot];
              image?.plotSprite(slotX, slotY);
            }
            slot++;
          }
        }
      } else if (child.type === 3 /* TYPE_RECT */) {
        if (child.fill) {
          Pix2D.fillRect(childX, childY, child.width, child.height, child.colour);
        } else {
          Pix2D.drawRect(childX, childY, child.width, child.height, child.colour);
        }
      } else if (child.type === 4 /* TYPE_TEXT */) {
        const font = child.font;
        let colour = child.colour;
        let text = child.text;
        if ((this.overChatComId === child.id || this.overSideComId === child.id || this.overMainComId === child.id) && child.colourOver !== 0) {
          colour = child.colourOver;
        }
        if (this.getIfActive(child)) {
          colour = child.colour2;
          if (child.text2 && child.text2.length > 0) {
            text = child.text2;
          }
        }
        if (child.buttonType === 6 /* BUTTON_CONTINUE */ && this.resumedPauseButton) {
          text = "Please wait...";
          colour = child.colour;
        }
        if (!font || !text) {
          continue;
        }
        for (let lineY = childY + font.height;text.length > 0; lineY += font.height) {
          if (text.indexOf("%") !== -1) {
            do {
              const index = text.indexOf("%1");
              if (index === -1) {
                break;
              }
              text = text.substring(0, index) + this.inf(this.getIfVar(child, 0)) + text.substring(index + 2);
            } while (true);
            do {
              const index = text.indexOf("%2");
              if (index === -1) {
                break;
              }
              text = text.substring(0, index) + this.inf(this.getIfVar(child, 1)) + text.substring(index + 2);
            } while (true);
            do {
              const index = text.indexOf("%3");
              if (index === -1) {
                break;
              }
              text = text.substring(0, index) + this.inf(this.getIfVar(child, 2)) + text.substring(index + 2);
            } while (true);
            do {
              const index = text.indexOf("%4");
              if (index === -1) {
                break;
              }
              text = text.substring(0, index) + this.inf(this.getIfVar(child, 3)) + text.substring(index + 2);
            } while (true);
            do {
              const index = text.indexOf("%5");
              if (index === -1) {
                break;
              }
              text = text.substring(0, index) + this.inf(this.getIfVar(child, 4)) + text.substring(index + 2);
            } while (true);
          }
          const newline = text.indexOf("\\n");
          let split;
          if (newline !== -1) {
            split = text.substring(0, newline);
            text = text.substring(newline + 2);
          } else {
            split = text;
            text = "";
          }
          if (child.centre) {
            font.centreStringTag(childX + (child.width / 2 | 0), lineY, split, colour, child.shadow);
          } else {
            font.drawStringTag(childX, lineY, split, colour, child.shadow);
          }
        }
      } else if (child.type === 5 /* TYPE_GRAPHIC */) {
        let image;
        if (this.getIfActive(child)) {
          image = child.graphic2;
        } else {
          image = child.graphic;
        }
        image?.plotSprite(childX, childY);
      } else if (child.type === 6 /* TYPE_MODEL */) {
        const tmpX = Pix3D.originX;
        const tmpY = Pix3D.originY;
        Pix3D.originX = childX + (child.width / 2 | 0);
        Pix3D.originY = childY + (child.height / 2 | 0);
        const eyeY = Pix3D.sinTable[child.modelXAn] * child.modelZoom >> 16;
        const eyeZ = Pix3D.cosTable[child.modelXAn] * child.modelZoom >> 16;
        const active = this.getIfActive(child);
        let seqId;
        if (active) {
          seqId = child.modelAnim2;
        } else {
          seqId = child.modelAnim;
        }
        let model = null;
        if (seqId === -1) {
          model = child.getTempModel(-1, -1, active);
        } else {
          const seq = SeqType.list[seqId];
          if (seq.frames && seq.iframes) {
            model = child.getTempModel(seq.frames[child.animFrame], seq.iframes[child.animFrame], active);
          }
        }
        if (model) {
          model.objRender(0, child.modelYAn, 0, child.modelXAn, 0, eyeY, eyeZ);
        }
        Pix3D.originX = tmpX;
        Pix3D.originY = tmpY;
      } else if (child.type === 7 /* TYPE_INV_TEXT */) {
        const font = child.font;
        if (!font || !child.linkObjType || !child.linkObjNumber) {
          continue;
        }
        let slot = 0;
        for (let row = 0;row < child.height; row++) {
          for (let col = 0;col < child.width; col++) {
            if (child.linkObjType[slot] > 0) {
              const obj = ObjType.list(child.linkObjType[slot] - 1);
              let text = obj.name;
              if (obj.stackable || child.linkObjNumber[slot] !== 1) {
                text = text + " x" + this.niceNumber(child.linkObjNumber[slot]);
              }
              if (!text) {
                continue;
              }
              const textX = childX + col * (child.marginX + 115);
              const textY = childY + row * (child.marginY + 12);
              if (child.centre) {
                font.centreStringTag(textX + (child.width / 2 | 0), textY, text, child.colour, child.shadow);
              } else {
                font.drawStringTag(textX, textY, text, child.colour, child.shadow);
              }
            }
            slot++;
          }
        }
      }
    }
    Pix2D.setClipping(left, top, right, bottom);
  }
  invNumber(amount) {
    if (amount < 1e5) {
      return String(amount);
    } else if (amount < 1e7) {
      return (amount / 1000 | 0) + "K";
    } else {
      return (amount / 1e6 | 0) + "M";
    }
  }
  niceNumber(amount) {
    let s = String(amount);
    for (let i = s.length - 3;i > 0; i -= 3) {
      s = s.substring(0, i) + "," + s.substring(i);
    }
    if (s.length > 8) {
      s = "@gre@" + s.substring(0, s.length - 8) + " million @whi@(" + s + ")";
    } else if (s.length > 4) {
      s = "@cya@" + s.substring(0, s.length - 4) + "K @whi@(" + s + ")";
    }
    return " " + s;
  }
  doScrollbar(x, y, scrollableHeight, height, redraw, left, top, com) {
    if (this.scrollGrabbed) {
      this.scrollInputPadding = 32;
    } else {
      this.scrollInputPadding = 0;
    }
    this.scrollGrabbed = false;
    if (x >= left && x < left + 16 && y >= top && y < top + 16) {
      com.scrollPos -= this.scrollCycle * 4;
      if (redraw) {
        this.redrawSidebar = true;
      }
    } else if (x >= left && x < left + 16 && y >= top + height - 16 && y < top + height) {
      com.scrollPos += this.scrollCycle * 4;
      if (redraw) {
        this.redrawSidebar = true;
      }
    } else if (x >= left - this.scrollInputPadding && x < left + this.scrollInputPadding + 16 && y >= top + 16 && y < top + height - 16 && this.scrollCycle > 0) {
      let gripSize = (height - 32) * height / scrollableHeight | 0;
      if (gripSize < 8) {
        gripSize = 8;
      }
      const gripY = y - top - (gripSize / 2 | 0) - 16;
      const maxY = height - gripSize - 32;
      com.scrollPos = (scrollableHeight - height) * gripY / maxY | 0;
      if (redraw) {
        this.redrawSidebar = true;
      }
      this.scrollGrabbed = true;
    }
  }
  drawScrollbar(x, y, scrollY, scrollHeight, height) {
    this.scrollbar1?.plotSprite(x, y);
    this.scrollbar2?.plotSprite(x, y + height - 16);
    Pix2D.fillRect(x, y + 16, 16, height - 32, SCROLLBAR_TRACK);
    let gripSize = (height - 32) * height / scrollHeight | 0;
    if (gripSize < 8) {
      gripSize = 8;
    }
    const gripY = (height - gripSize - 32) * scrollY / (scrollHeight - height) | 0;
    Pix2D.fillRect(x, y + gripY + 16, 16, gripSize, SCROLLBAR_GRIP_FOREGROUND);
    Pix2D.vline(x, y + gripY + 16, SCROLLBAR_GRIP_HIGHLIGHT, gripSize);
    Pix2D.vline(x + 1, y + gripY + 16, SCROLLBAR_GRIP_HIGHLIGHT, gripSize);
    Pix2D.hline(x, y + gripY + 16, SCROLLBAR_GRIP_HIGHLIGHT, 16);
    Pix2D.hline(x, y + gripY + 17, SCROLLBAR_GRIP_HIGHLIGHT, 16);
    Pix2D.vline(x + 15, y + gripY + 16, SCROLLBAR_GRIP_LOWLIGHT, gripSize);
    Pix2D.vline(x + 14, y + gripY + 17, SCROLLBAR_GRIP_LOWLIGHT, gripSize - 1);
    Pix2D.hline(x, y + gripY + gripSize + 15, SCROLLBAR_GRIP_LOWLIGHT, 16);
    Pix2D.hline(x + 1, y + gripY + gripSize + 14, SCROLLBAR_GRIP_LOWLIGHT, 15);
  }
  inf(value) {
    return value < 999999999 ? String(value) : "*";
  }
  getIfActive(com) {
    if (!com.scriptComparator) {
      return false;
    }
    for (let i = 0;i < com.scriptComparator.length; i++) {
      if (!com.scriptOperand) {
        return false;
      }
      const value = this.getIfVar(com, i);
      const operand = com.scriptOperand[i];
      if (com.scriptComparator[i] === 2) {
        if (value >= operand) {
          return false;
        }
      } else if (com.scriptComparator[i] === 3) {
        if (value <= operand) {
          return false;
        }
      } else if (com.scriptComparator[i] === 4) {
        if (value === operand) {
          return false;
        }
      } else if (value !== operand) {
        return false;
      }
    }
    return true;
  }
  getIfVar(com, scriptId) {
    if (!com.scripts || scriptId >= com.scripts.length) {
      return -2;
    }
    try {
      const script = com.scripts[scriptId];
      if (!script) {
        return -1;
      }
      let register = 0;
      let pc = 0;
      while (true) {
        const opcode = script[pc++];
        if (opcode === 0) {
          return register;
        }
        if (opcode === 1) {
          register += this.statEffectiveLevel[script[pc++]];
        } else if (opcode === 2) {
          register += this.statBaseLevel[script[pc++]];
        } else if (opcode === 3) {
          register += this.statXP[script[pc++]];
        } else if (opcode === 4) {
          const com2 = IfType.list[script[pc++]];
          const obj = script[pc++] + 1;
          if (com2.linkObjType && com2.linkObjNumber) {
            for (let i = 0;i < com2.linkObjType.length; i++) {
              if (com2.linkObjType[i] === obj) {
                register += com2.linkObjNumber[i];
              }
            }
          }
        } else if (opcode === 5) {
          register += this.var[script[pc++]];
        } else if (opcode === 6) {
          register += Client.levelExperience[this.statBaseLevel[script[pc++]] - 1];
        } else if (opcode === 7) {
          register += this.var[script[pc++]] * 100 / 46875 | 0;
        } else if (opcode === 8) {
          register += this.localPlayer?.combatLevel || 0;
        } else if (opcode === 9) {
          for (let i = 0;i < 19; i++) {
            if (i === 18) {
              i = 20;
            }
            register += this.statBaseLevel[i];
          }
        } else if (opcode === 10) {
          const com2 = IfType.list[script[pc++]];
          const obj = script[pc++] + 1;
          if (com2.linkObjType) {
            for (let i = 0;i < com2.linkObjType.length; i++) {
              if (com2.linkObjType[i] === obj) {
                register += 999999999;
                break;
              }
            }
          }
        } else if (opcode === 11) {
          register += this.runenergy;
        } else if (opcode === 12) {
          register += this.runweight;
        } else if (opcode === 13) {
          const varp = this.var[script[pc++]];
          const lsb = script[pc++];
          register += (varp & 1 << lsb) === 0 ? 0 : 1;
        }
      }
    } catch (_e) {
      return -1;
    }
  }
  ifAnimReset(id) {
    const parent = IfType.list[id];
    if (!parent.children) {
      return;
    }
    for (let i = 0;i < parent.children.length && parent.children[i] !== -1; i++) {
      const child = IfType.list[parent.children[i]];
      if (child.type === 1) {
        this.ifAnimReset(child.id);
      }
      child.animFrame = 0;
      child.animCycle = 0;
    }
  }
  animateInterface(id, delta) {
    const parent = IfType.list[id];
    if (!parent.children) {
      return false;
    }
    let updated = false;
    for (let i = 0;i < parent.children.length && parent.children[i] !== -1; i++) {
      const child = IfType.list[parent.children[i]];
      if (child.type === 1) {
        updated ||= this.animateInterface(child.id, delta);
      }
      if (child.type === 6 && (child.modelAnim !== -1 || child.modelAnim2 !== -1)) {
        const active = this.getIfActive(child);
        let seqId;
        if (active) {
          seqId = child.modelAnim2;
        } else {
          seqId = child.modelAnim;
        }
        if (seqId !== -1) {
          const type = SeqType.list[seqId];
          child.animCycle += delta;
          if (type.delay) {
            while (child.animCycle > type.delay[child.animFrame]) {
              child.animCycle -= type.delay[child.animFrame] + 1;
              child.animFrame++;
              if (child.animFrame >= type.numFrames) {
                child.animFrame -= type.loops;
                if (child.animFrame < 0 || child.animFrame >= type.numFrames) {
                  child.animFrame = 0;
                }
              }
              updated = true;
            }
          }
        }
      }
    }
    return updated;
  }
  async clientVar(id) {
    const clientcode = VarpType.list[id].clientcode;
    if (clientcode === 0) {
      return;
    }
    const value = this.var[id];
    if (clientcode === 1) {
      if (value === 1) {
        Pix3D.initColourTable(0.9);
      } else if (value === 2) {
        Pix3D.initColourTable(0.8);
      } else if (value === 3) {
        Pix3D.initColourTable(0.7);
      } else if (value === 4) {
        Pix3D.initColourTable(0.6);
      }
      ObjType.spriteCache?.clear();
      this.redrawFrame = true;
    } else if (clientcode === 3) {
      const lastMidiActive = this.midiActive;
      if (value === 0) {
        this.midiVolume = 0;
        this.midiActive = true;
      } else if (value === 1) {
        this.midiVolume = -4;
        this.midiActive = true;
      } else if (value === 2) {
        this.midiVolume = -8;
        this.midiActive = true;
      } else if (value === 3) {
        this.midiVolume = -12;
        this.midiActive = true;
      } else if (value === 4) {
        this.midiActive = false;
      }
      if (this.midiActive) {
        setMidiVolume(this.midiVolume);
      }
      if (this.midiActive !== lastMidiActive) {
        if (this.midiActive && this.midiSong) {
          await this.saveMidi(this.midiSong, this.midiCrc, this.midiSize, false);
        } else {
          stopMidi(false);
        }
        this.nextMusicDelay = 0;
      }
    } else if (clientcode === 4) {
      if (value === 0) {
        this.waveVolume = 0;
        this.waveEnabled = true;
      } else if (value === 1) {
        this.waveVolume = -4;
        this.waveEnabled = true;
      } else if (value === 2) {
        this.waveVolume = -8;
        this.waveEnabled = true;
      } else if (value === 3) {
        this.waveVolume = -12;
        this.waveEnabled = true;
      } else if (value === 4) {
        this.waveEnabled = false;
      }
      if (this.waveEnabled) {
        setWaveVolume(this.waveVolume);
      }
    } else if (clientcode === 5) {
      this.oneMouseButton = value;
    } else if (clientcode === 6) {
      this.chatEffects = value;
    } else if (clientcode === 8) {
      this.splitPrivateChat = value;
      this.redrawChatback = true;
    }
  }
  clientComponent(com) {
    let clientCode = com.clientCode;
    if (clientCode >= 1 /* CC_FRIENDS_START */ && clientCode <= 100 /* CC_FRIENDS_END */) {
      clientCode--;
      if (clientCode >= this.friendCount) {
        com.text = "";
        com.buttonType = 0;
      } else {
        com.text = this.friendUsername[clientCode];
        com.buttonType = 1;
      }
    } else if (clientCode >= 101 /* CC_FRIENDS_UPDATE_START */ && clientCode <= 200 /* CC_FRIENDS_UPDATE_END */) {
      clientCode -= 101 /* CC_FRIENDS_UPDATE_START */;
      if (clientCode >= this.friendCount) {
        com.text = "";
        com.buttonType = 0;
      } else {
        if (this.friendNodeId[clientCode] === 0) {
          com.text = "@red@Offline";
        } else if (this.friendNodeId[clientCode] === Client.nodeId) {
          com.text = "@gre@World-" + (this.friendNodeId[clientCode] - 9);
        } else {
          com.text = "@yel@World-" + (this.friendNodeId[clientCode] - 9);
        }
        com.buttonType = 1;
      }
    } else if (clientCode === 203 /* CC_FRIENDS_SIZE */) {
      com.scrollHeight = this.friendCount * 15 + 20;
      if (com.scrollHeight <= com.height) {
        com.scrollHeight = com.height + 1;
      }
    } else if (clientCode >= 401 /* CC_IGNORES_START */ && clientCode <= 500 /* CC_IGNORES_END */) {
      clientCode -= 401 /* CC_IGNORES_START */;
      if (clientCode >= this.ignoreCount) {
        com.text = "";
        com.buttonType = 0;
      } else {
        com.text = JString.toScreenName(JString.toRawUsername(this.ignoreUserhash[clientCode]));
        com.buttonType = 1;
      }
    } else if (clientCode === 503 /* CC_IGNORES_SIZE */) {
      com.scrollHeight = this.ignoreCount * 15 + 20;
      if (com.scrollHeight <= com.height) {
        com.scrollHeight = com.height + 1;
      }
    } else if (clientCode === 327 /* CC_DESIGN_PREVIEW */) {
      com.modelXAn = 150;
      com.modelYAn = (Math.sin(this.loopCycle / 40) * 256 | 0) & 2047;
      if (this.idkDesignRedraw) {
        this.idkDesignRedraw = false;
        const models = new TypedArray1d(7, null);
        let modelCount = 0;
        for (let part = 0;part < 7; part++) {
          const kit = this.idkDesignPart[part];
          if (kit >= 0) {
            models[modelCount++] = IdkType.list[kit].getModel();
          }
        }
        const model = Model.combineForAnim(models, modelCount);
        for (let part = 0;part < 5; part++) {
          if (this.idkDesignColour[part] !== 0) {
            model.recolour(ClientPlayer.recol1d[part][0], ClientPlayer.recol1d[part][this.idkDesignColour[part]]);
            if (part === 1) {
              model.recolour(ClientPlayer.recol2d[0], ClientPlayer.recol2d[this.idkDesignColour[part]]);
            }
          }
        }
        if (this.localPlayer) {
          const frames = SeqType.list[this.localPlayer.readyanim].frames;
          if (frames) {
            model.prepareAnim();
            model.animate(frames[0]);
            model.calculateNormals(64, 850, -30, -50, -30, true);
            com.model1 = model;
          }
        }
      }
    } else if (clientCode === 324 /* CC_SWITCH_TO_MALE */) {
      if (!this.idkDesignButton1) {
        this.idkDesignButton1 = com.graphic;
        this.idkDesignButton2 = com.graphic2;
      }
      if (this.idkDesignGender) {
        com.graphic = this.idkDesignButton2;
      } else {
        com.graphic = this.idkDesignButton1;
      }
    } else if (clientCode === 325 /* CC_SWITCH_TO_FEMALE */) {
      if (!this.idkDesignButton1) {
        this.idkDesignButton1 = com.graphic;
        this.idkDesignButton2 = com.graphic2;
      }
      if (this.idkDesignGender) {
        com.graphic = this.idkDesignButton1;
      } else {
        com.graphic = this.idkDesignButton2;
      }
    } else if (clientCode === 600 /* CC_REPORT_INPUT */) {
      com.text = this.reportAbuseInput;
      if (this.loopCycle % 20 < 10) {
        com.text = com.text + "|";
      } else {
        com.text = com.text + " ";
      }
    } else if (clientCode === 613 /* CC_MOD_MUTE */) {
      if (!this.staffmod) {
        com.text = "";
      } else if (this.reportAbuseMuteOption) {
        com.colour = 16711680 /* RED */;
        com.text = "Moderator option: Mute player for 48 hours: <ON>";
      } else {
        com.colour = 16777215 /* WHITE */;
        com.text = "Moderator option: Mute player for 48 hours: <OFF>";
      }
    } else if (clientCode === 650 /* CC_LAST_LOGIN_INFO */ || clientCode === 655 /* CC_LAST_LOGIN_INFO2 */) {
      if (this.lastAddress === 0) {
        com.text = "";
      } else {
        let text;
        if (this.daysSinceLastLogin === 0) {
          text = "earlier today";
        } else if (this.daysSinceLastLogin === 1) {
          text = "yesterday";
        } else {
          text = this.daysSinceLastLogin + " days ago";
        }
        const ipStr = JString.formatIPv4(this.lastAddress);
        com.text = "You last logged in " + text + (ipStr === "127.0.0.1" ? "." : " from: " + ipStr);
      }
    } else if (clientCode === 651 /* CC_UNREAD_MESSAGES */) {
      if (this.unreadMessages === 0) {
        com.text = "0 unread messages";
        com.colour = 16776960 /* YELLOW */;
      } else if (this.unreadMessages === 1) {
        com.text = "1 unread message";
        com.colour = 65280 /* GREEN */;
      } else if (this.unreadMessages > 1) {
        com.text = this.unreadMessages + " unread messages";
        com.colour = 65280 /* GREEN */;
      }
    } else if (clientCode === 652 /* CC_RECOVERY1 */) {
      if (this.daysSinceRecoveriesChanged === 201) {
        com.text = "";
      } else if (this.daysSinceRecoveriesChanged === 200) {
        com.text = "You have not yet set any password recovery questions.";
      } else {
        let text;
        if (this.daysSinceRecoveriesChanged === 0) {
          text = "Earlier today";
        } else if (this.daysSinceRecoveriesChanged === 1) {
          text = "Yesterday";
        } else {
          text = this.daysSinceRecoveriesChanged + " days ago";
        }
        com.text = text + " you changed your recovery questions";
      }
    } else if (clientCode === 653 /* CC_RECOVERY2 */) {
      if (this.daysSinceRecoveriesChanged === 201) {
        com.text = "";
      } else if (this.daysSinceRecoveriesChanged === 200) {
        com.text = "We strongly recommend you do so now to secure your account.";
      } else {
        com.text = "If you do not remember making this change then cancel it immediately";
      }
    } else if (clientCode === 654 /* CC_RECOVERY3 */) {
      if (this.daysSinceRecoveriesChanged === 201) {
        com.text = "";
      } else if (this.daysSinceRecoveriesChanged === 200) {
        com.text = "Do this from the 'account management' area on our front webpage";
      } else {
        com.text = "Do this from the 'account management' area on our front webpage";
      }
    }
  }
  closeModal() {
    this.out.p1Enc(231 /* CLOSE_MODAL */);
    if (this.sideModalId !== -1) {
      this.sideModalId = -1;
      this.redrawSidebar = true;
      this.resumedPauseButton = false;
      this.redrawSideicons = true;
    }
    if (this.chatComId !== -1) {
      this.chatComId = -1;
      this.redrawChatback = true;
      this.resumedPauseButton = false;
    }
    this.mainModalId = -1;
  }
  clientButton(com) {
    const clientCode = com.clientCode;
    if (clientCode === 201 /* CC_ADD_FRIEND */) {
      this.redrawChatback = true;
      this.dialogInputOpen = false;
      this.socialInputOpen = true;
      this.socialInput = "";
      this.socialInputType = 1;
      this.socialInputHeader = "Enter name of friend to add to list";
    } else if (clientCode === 202 /* CC_DEL_FRIEND */) {
      this.redrawChatback = true;
      this.dialogInputOpen = false;
      this.socialInputOpen = true;
      this.socialInput = "";
      this.socialInputType = 2;
      this.socialInputHeader = "Enter name of friend to delete from list";
    } else if (clientCode === 205 /* CC_LOGOUT */) {
      this.logoutTimer = 250;
      return true;
    } else if (clientCode === 501 /* CC_ADD_IGNORE */) {
      this.redrawChatback = true;
      this.dialogInputOpen = false;
      this.socialInputOpen = true;
      this.socialInput = "";
      this.socialInputType = 4;
      this.socialInputHeader = "Enter name of player to add to list";
    } else if (clientCode === 502 /* CC_DEL_IGNORE */) {
      this.redrawChatback = true;
      this.dialogInputOpen = false;
      this.socialInputOpen = true;
      this.socialInput = "";
      this.socialInputType = 5;
      this.socialInputHeader = "Enter name of player to delete from list";
    } else if (clientCode >= 300 /* CC_CHANGE_HEAD_L */ && clientCode <= 313 /* CC_CHANGE_FEET_R */) {
      const part = (clientCode - 300) / 2 | 0;
      const direction = clientCode & 1;
      let kit = this.idkDesignPart[part];
      if (kit !== -1) {
        while (true) {
          if (direction === 0) {
            kit--;
            if (kit < 0) {
              kit = IdkType.numDefinitions - 1;
            }
          }
          if (direction === 1) {
            kit++;
            if (kit >= IdkType.numDefinitions) {
              kit = 0;
            }
          }
          if (!IdkType.list[kit].disable && IdkType.list[kit].part === part + (this.idkDesignGender ? 0 : 7)) {
            this.idkDesignPart[part] = kit;
            this.idkDesignRedraw = true;
            break;
          }
        }
      }
    } else if (clientCode >= 314 /* CC_RECOLOUR_HAIR_L */ && clientCode <= 323 /* CC_RECOLOUR_SKIN_R */) {
      const part = (clientCode - 314) / 2 | 0;
      const direction = clientCode & 1;
      let colour = this.idkDesignColour[part];
      if (direction === 0) {
        colour--;
        if (colour < 0) {
          colour = ClientPlayer.recol1d[part].length - 1;
        }
      }
      if (direction === 1) {
        colour++;
        if (colour >= ClientPlayer.recol1d[part].length) {
          colour = 0;
        }
      }
      this.idkDesignColour[part] = colour;
      this.idkDesignRedraw = true;
    } else if (clientCode === 324 /* CC_SWITCH_TO_MALE */ && !this.idkDesignGender) {
      this.idkDesignGender = true;
      this.validateIdkDesign();
    } else if (clientCode === 325 /* CC_SWITCH_TO_FEMALE */ && this.idkDesignGender) {
      this.idkDesignGender = false;
      this.validateIdkDesign();
    } else if (clientCode === 326 /* CC_ACCEPT_DESIGN */) {
      this.out.p1Enc(52 /* IDK_SAVEDESIGN */);
      this.out.p1(this.idkDesignGender ? 0 : 1);
      for (let i = 0;i < 7; i++) {
        this.out.p1(this.idkDesignPart[i]);
      }
      for (let i = 0;i < 5; i++) {
        this.out.p1(this.idkDesignColour[i]);
      }
      return true;
    } else if (clientCode === 613 /* CC_MOD_MUTE */) {
      this.reportAbuseMuteOption = !this.reportAbuseMuteOption;
    } else if (clientCode >= 601 /* CC_REPORT_RULE1 */ && clientCode <= 612 /* CC_REPORT_RULE12 */) {
      this.closeModal();
      if (this.reportAbuseInput.length > 0) {
        this.out.p1Enc(190 /* SEND_SNAPSHOT */);
        this.out.p8(JString.toUserhash(this.reportAbuseInput));
        this.out.p1(clientCode - 601);
        this.out.p1(this.reportAbuseMuteOption ? 1 : 0);
      }
    }
    return false;
  }
  validateIdkDesign() {
    this.idkDesignRedraw = true;
    for (let i = 0;i < 7; i++) {
      this.idkDesignPart[i] = -1;
      for (let j = 0;j < IdkType.numDefinitions; j++) {
        if (!IdkType.list[j].disable && IdkType.list[j].part === i + (this.idkDesignGender ? 0 : 7)) {
          this.idkDesignPart[i] = j;
          break;
        }
      }
    }
  }
  drawSidebar() {
    this.areaSidebar?.setPixels();
    if (this.sidebarScanline) {
      Pix3D.scanline = this.sidebarScanline;
    }
    this.invback?.plotSprite(0, 0);
    if (this.sideModalId !== -1) {
      this.drawInterface(IfType.list[this.sideModalId], 0, 0, 0);
    } else if (this.sideOverlayId[this.sideTab] !== -1) {
      this.drawInterface(IfType.list[this.sideOverlayId[this.sideTab]], 0, 0, 0);
    }
    if (this.isMenuOpen && this.menuArea === 1) {
      this.drawMinimenu();
    }
    this.areaSidebar?.draw(562, 231);
    this.areaViewport?.setPixels();
    if (this.viewportScanline) {
      Pix3D.scanline = this.viewportScanline;
    }
  }
  drawChat() {
    this.areaChatback?.setPixels();
    if (this.chatbackScanline) {
      Pix3D.scanline = this.chatbackScanline;
    }
    this.chatback?.plotSprite(0, 0);
    if (this.socialInputOpen) {
      this.b12?.centreString(239, 40, this.socialInputHeader, 0 /* BLACK */);
      this.b12?.centreString(239, 60, this.socialInput + "*", 128 /* DARKBLUE */);
    } else if (this.dialogInputOpen) {
      this.b12?.centreString(239, 40, "Enter amount:", 0 /* BLACK */);
      this.b12?.centreString(239, 60, this.dialogInput + "*", 128 /* DARKBLUE */);
    } else if (this.tutComMessage) {
      this.b12?.centreString(239, 40, this.tutComMessage, 0 /* BLACK */);
      this.b12?.centreString(239, 60, "Click to continue", 128 /* DARKBLUE */);
    } else if (this.chatComId !== -1) {
      this.drawInterface(IfType.list[this.chatComId], 0, 0, 0);
    } else if (this.tutComId !== -1) {
      this.drawInterface(IfType.list[this.tutComId], 0, 0, 0);
    } else {
      const font = this.p12;
      let line = 0;
      Pix2D.setClipping(0, 0, 463, 77);
      for (let i = 0;i < 100; i++) {
        const message = this.chatText[i];
        if (!message) {
          continue;
        }
        const type = this.chatType[i];
        const y = this.chatScrollPos + 70 - line * 14;
        if (type === 0) {
          if (y > 0 && y < 110) {
            font?.drawString(4, y, message, 0 /* BLACK */);
          }
          line++;
        } else if (type === 1) {
          if (y > 0 && y < 110) {
            font?.drawString(4, y, this.chatUsername[i] + ":", 16777215 /* WHITE */);
            font?.drawString(font.stringWid(this.chatUsername[i]) + 12, y, message, 255 /* BLUE */);
          }
          line++;
        } else if (type === 2 && (this.chatPublicMode === 0 || this.chatPublicMode === 1 && this.isFriend(this.chatUsername[i]))) {
          if (y > 0 && y < 110) {
            font?.drawString(4, y, this.chatUsername[i] + ":", 0 /* BLACK */);
            font?.drawString(font.stringWid(this.chatUsername[i]) + 12, y, message, 255 /* BLUE */);
          }
          line++;
        } else if ((type === 3 || type === 7) && this.splitPrivateChat === 0 && (type === 7 || this.chatPrivateMode === 0 || this.chatPrivateMode === 1 && this.isFriend(this.chatUsername[i]))) {
          if (y > 0 && y < 110) {
            font?.drawString(4, y, "From " + this.chatUsername[i] + ":", 0 /* BLACK */);
            font?.drawString(font.stringWid("From " + this.chatUsername[i]) + 12, y, message, 8388608 /* DARKRED */);
          }
          line++;
        } else if (type === 4 && (this.chatTradeMode === 0 || this.chatTradeMode === 1 && this.isFriend(this.chatUsername[i]))) {
          if (y > 0 && y < 110) {
            font?.drawString(4, y, this.chatUsername[i] + " " + this.chatText[i], 8388736);
          }
          line++;
        } else if (type === 5 && this.splitPrivateChat === 0 && this.chatPrivateMode < 2) {
          if (y > 0 && y < 110) {
            font?.drawString(4, y, message, 8388608 /* DARKRED */);
          }
          line++;
        } else if (type === 6 && this.splitPrivateChat === 0 && this.chatPrivateMode < 2) {
          if (y > 0 && y < 110) {
            font?.drawString(4, y, "To " + this.chatUsername[i] + ":", 0 /* BLACK */);
            font?.drawString(font.stringWid("To " + this.chatUsername[i]) + 12, y, message, 8388608 /* DARKRED */);
          }
          line++;
        } else if (type === 8 && (this.chatTradeMode === 0 || this.chatTradeMode === 1 && this.isFriend(this.chatUsername[i]))) {
          if (y > 0 && y < 110) {
            font?.drawString(4, y, this.chatUsername[i] + " " + this.chatText[i], 13350793);
          }
          line++;
        }
      }
      Pix2D.resetClipping();
      this.chatScrollHeight = line * 14 + 7;
      if (this.chatScrollHeight < 78) {
        this.chatScrollHeight = 78;
      }
      this.drawScrollbar(463, 0, this.chatScrollHeight - this.chatScrollPos - 77, this.chatScrollHeight, 77);
      font?.drawString(4, 90, JString.toScreenName(this.loginUser) + ":", 0 /* BLACK */);
      font?.drawString(font.stringWid(this.loginUser + ": ") + 6, 90, this.chatInput + "*", 255 /* BLUE */);
      Pix2D.hline(0, 77, 0 /* BLACK */, 479);
    }
    if (this.isMenuOpen && this.menuArea === 2) {
      this.drawMinimenu();
    }
    this.areaChatback?.draw(22, 375);
    this.areaViewport?.setPixels();
    if (this.viewportScanline) {
      Pix3D.scanline = this.viewportScanline;
    }
  }
  minimapDraw() {
    if (!this.localPlayer) {
      return;
    }
    this.areaMapback?.setPixels();
    const angle = this.orbitCameraYaw + this.macroMinimapAngle & 2047;
    let anchorX = (this.localPlayer.x / 32 | 0) + 48;
    let anchorY = 464 - (this.localPlayer.z / 32 | 0);
    this.minimap?.scanlineRotatePlotSprite(21, 9, 146, 151, this.minimapMaskLineOffsets, this.minimapMaskLineLengths, anchorX, anchorY, angle, this.macroMinimapZoom + 256);
    this.compass?.scanlineRotatePlotSprite(0, 0, 33, 33, this.compassMaskLineOffsets, this.compassMaskLineLengths, 25, 25, this.orbitCameraYaw, 256);
    for (let i = 0;i < this.activeMapFunctionCount; i++) {
      anchorX = this.activeMapFunctionX[i] * 4 + 2 - (this.localPlayer.x / 32 | 0);
      anchorY = this.activeMapFunctionZ[i] * 4 + 2 - (this.localPlayer.z / 32 | 0);
      this.minimapDrawDot(anchorY, this.activeMapFunctions[i], anchorX);
    }
    for (let ltx = 0;ltx < 104 /* SIZE */; ltx++) {
      for (let ltz = 0;ltz < 104 /* SIZE */; ltz++) {
        const objs = this.groundObj[this.minusedlevel][ltx][ltz];
        if (objs) {
          anchorX = ltx * 4 + 2 - (this.localPlayer.x / 32 | 0);
          anchorY = ltz * 4 + 2 - (this.localPlayer.z / 32 | 0);
          this.minimapDrawDot(anchorY, this.mapdots1, anchorX);
        }
      }
    }
    for (let i = 0;i < this.npcCount; i++) {
      const npc = this.npc[this.npcIds[i]];
      if (npc && npc.isReady() && npc.type && npc.type.minimap) {
        anchorX = (npc.x / 32 | 0) - (this.localPlayer.x / 32 | 0);
        anchorY = (npc.z / 32 | 0) - (this.localPlayer.z / 32 | 0);
        this.minimapDrawDot(anchorY, this.mapdots2, anchorX);
      }
    }
    for (let i = 0;i < this.playerCount; i++) {
      const player = this.players[this.playerIds[i]];
      if (player && player.isReady() && player.name) {
        anchorX = (player.x / 32 | 0) - (this.localPlayer.x / 32 | 0);
        anchorY = (player.z / 32 | 0) - (this.localPlayer.z / 32 | 0);
        let friend = false;
        const userhash = JString.toUserhash(player.name);
        for (let j = 0;j < this.friendCount; j++) {
          if (userhash === this.friendUserhash[j] && this.friendNodeId[j] !== 0) {
            friend = true;
            break;
          }
        }
        if (friend) {
          this.minimapDrawDot(anchorY, this.mapdots4, anchorX);
        } else {
          this.minimapDrawDot(anchorY, this.mapdots3, anchorX);
        }
      }
    }
    if (this.minimapFlagX !== 0) {
      anchorX = this.minimapFlagX * 4 + 2 - (this.localPlayer.x / 32 | 0);
      anchorY = this.minimapFlagZ * 4 + 2 - (this.localPlayer.z / 32 | 0);
      this.minimapDrawDot(anchorY, this.mapflag, anchorX);
    }
    Pix2D.fillRect(93, 82, 3, 3, 16777215 /* WHITE */);
    this.areaViewport?.setPixels();
  }
  minimapDrawDot(dy, image, dx) {
    if (!image) {
      return;
    }
    const distance = dx * dx + dy * dy;
    if (distance > 6400) {
      return;
    }
    const angle = this.orbitCameraYaw + this.macroMinimapAngle & 2047;
    let sinAngle = Pix3D.sinTable[angle];
    let cosAngle = Pix3D.cosTable[angle];
    sinAngle = sinAngle * 256 / (this.macroMinimapZoom + 256) | 0;
    cosAngle = cosAngle * 256 / (this.macroMinimapZoom + 256) | 0;
    const x = dy * sinAngle + dx * cosAngle >> 16;
    const y = dy * cosAngle - dx * sinAngle >> 16;
    if (distance > 2500 && this.mapback) {
      image.scanlinePlotSprite(x + 94 - (image.owi / 2 | 0), 83 - y - (image.ohi / 2 | 0), this.mapback);
    } else {
      image.plotSprite(x + 94 - (image.owi / 2 | 0), 83 - y - (image.ohi / 2 | 0));
    }
  }
  addChat(type, text, sender) {
    if (type === 0 && this.tutComId !== -1) {
      this.tutComMessage = text;
      this.mouseClickButton = 0;
    }
    if (this.chatComId === -1) {
      this.redrawChatback = true;
    }
    for (let i = 99;i > 0; i--) {
      this.chatType[i] = this.chatType[i - 1];
      this.chatUsername[i] = this.chatUsername[i - 1];
      this.chatText[i] = this.chatText[i - 1];
    }
    this.chatType[0] = type;
    this.chatUsername[0] = sender;
    this.chatText[0] = text;
  }
  isFriend(username) {
    if (!username) {
      return false;
    }
    for (let i = 0;i < this.friendCount; i++) {
      if (username.toLowerCase() === this.friendUsername[i]?.toLowerCase()) {
        return true;
      }
    }
    if (!this.localPlayer) {
      return false;
    }
    return username.toLowerCase() === this.localPlayer.name?.toLowerCase();
  }
  addFriend(userhash) {
    if (userhash === 0n) {
      return;
    }
    if (this.friendCount >= 100) {
      this.addChat(0, "Your friends list is full. Max of 100 hit", "");
      return;
    }
    const displayName = JString.toScreenName(JString.toRawUsername(userhash));
    for (let i = 0;i < this.friendCount; i++) {
      if (this.friendUserhash[i] === userhash) {
        this.addChat(0, displayName + " is already on your friend list", "");
        return;
      }
    }
    for (let i = 0;i < this.ignoreCount; i++) {
      if (this.ignoreUserhash[i] === userhash) {
        this.addChat(0, "Please remove " + displayName + " from your ignore list first", "");
        return;
      }
    }
    if (!this.localPlayer || !this.localPlayer.name) {
      return;
    }
    if (displayName !== this.localPlayer.name) {
      this.friendUsername[this.friendCount] = displayName;
      this.friendUserhash[this.friendCount] = userhash;
      this.friendNodeId[this.friendCount] = 0;
      this.friendCount++;
      this.redrawSidebar = true;
      this.out.p1Enc(118 /* FRIENDLIST_ADD */);
      this.out.p8(userhash);
    }
  }
  addIgnore(userhash) {
    if (userhash === 0n) {
      return;
    }
    if (this.ignoreCount >= 100) {
      this.addChat(0, "Your ignore list is full. Max of 100 hit", "");
      return;
    }
    const displayName = JString.toScreenName(JString.toRawUsername(userhash));
    for (let i = 0;i < this.ignoreCount; i++) {
      if (this.ignoreUserhash[i] === userhash) {
        this.addChat(0, displayName + " is already on your ignore list", "");
        return;
      }
    }
    for (let i = 0;i < this.friendCount; i++) {
      if (this.friendUserhash[i] === userhash) {
        this.addChat(0, "Please remove " + displayName + " from your friend list first", "");
        return;
      }
    }
    this.ignoreUserhash[this.ignoreCount++] = userhash;
    this.redrawSidebar = true;
    this.out.p1Enc(79 /* IGNORELIST_ADD */);
    this.out.p8(userhash);
  }
  delFriend(userhash) {
    if (userhash === 0n) {
      return;
    }
    for (let i = 0;i < this.friendCount; i++) {
      if (this.friendUserhash[i] === userhash) {
        this.friendCount--;
        this.redrawSidebar = true;
        for (let j = i;j < this.friendCount; j++) {
          this.friendUsername[j] = this.friendUsername[j + 1];
          this.friendNodeId[j] = this.friendNodeId[j + 1];
          this.friendUserhash[j] = this.friendUserhash[j + 1];
        }
        this.out.p1Enc(11 /* FRIENDLIST_DEL */);
        this.out.p8(userhash);
        return;
      }
    }
  }
  delIgnore(userhash) {
    if (userhash === 0n) {
      return;
    }
    for (let i = 0;i < this.ignoreCount; i++) {
      if (this.ignoreUserhash[i] === userhash) {
        this.ignoreCount--;
        this.redrawSidebar = true;
        for (let j = i;j < this.ignoreCount; j++) {
          this.ignoreUserhash[j] = this.ignoreUserhash[j + 1];
        }
        this.out.p1Enc(171 /* IGNORELIST_DEL */);
        this.out.p8(userhash);
        return;
      }
    }
  }
  startedInViewport = false;
  startedInTabArea = false;
  startedInChatScroll = false;
  ttime = -1;
  sx = 0;
  sy = 0;
  mx = 0;
  my = 0;
  nx = 0;
  ny = 0;
  dragging = false;
  panning = false;
  pointerDown(x, y, e) {
    if (MobileKeyboard_default.isWithinCanvasKeyboard(x, y) && !this.exceedsGrabThreshold(20)) {
      MobileKeyboard_default.captureMouseDown(x, y);
      return;
    }
    if (e.pointerType !== "mouse") {
      this.idleTimer = performance.now();
      this.mouseClickX = -1;
      this.mouseClickY = -1;
      this.mouseClickButton = 0;
      this.mouseX = x;
      this.mouseY = y;
      this.mouseButton = 0;
      this.sx = this.nx = this.mx = e.screenX | 0;
      this.sy = this.ny = this.my = e.screenY | 0;
      this.ttime = e.timeStamp;
      this.startedInViewport = this.insideViewportArea();
      this.startedInTabArea = this.insideTabArea();
      this.startedInChatScroll = this.insideChatScrollArea();
    }
  }
  mouseUp(x, y, e) {
    this.idleTimer = performance.now();
    this.mouseButton = 0;
    this.mouseX = x;
    this.mouseY = y;
  }
  pointerUp(x, y, e) {
    if (MobileKeyboard_default.isWithinCanvasKeyboard(x, y) && !this.exceedsGrabThreshold(20)) {
      MobileKeyboard_default.captureMouseUp(x, y);
      return;
    }
    if (e.pointerType !== "mouse") {
      this.idleTimer = performance.now();
      this.mouseX = x;
      this.mouseY = y;
      if (this.dragging) {
        this.dragging = false;
        this.mouseClickX = -1;
        this.mouseClickY = -1;
        this.mouseClickButton = 0;
        this.mouseButton = 0;
      } else if (this.panning) {
        this.panning = false;
        this.keyHeld[1] = 0;
        this.keyHeld[2] = 0;
        this.keyHeld[3] = 0;
        this.keyHeld[4] = 0;
        return;
      } else {
        if (!MobileKeyboard_default.isDisplayed() && this.insideMobileInputArea()) {
          MobileKeyboard_default.show(x, y, e.clientX, e.clientY);
        } else if (MobileKeyboard_default.isDisplayed() && !MobileKeyboard_default.isWithinCanvasKeyboard(x, y)) {
          MobileKeyboard_default.hide();
          this.refresh();
        }
        this.mouseClickX = x;
        this.mouseClickY = y;
        const longPress = e.timeStamp >= this.ttime + 500;
        if (longPress) {
          this.mouseClickButton = 2;
          this.mouseButton = 2;
        } else {
          this.mouseClickButton = 1;
          this.mouseButton = 1;
        }
        setTimeout(() => {
          this.mouseButton = 0;
        }, 40);
      }
    }
  }
  pointerEnter(x, y, e) {
    if (e.pointerType === "mouse") {
      this.mouseX = x;
      this.mouseY = y;
    } else {
      this.idleTimer = performance.now();
      this.mouseClickX = -1;
      this.mouseClickY = -1;
      this.mouseClickButton = 0;
      this.mouseX = x;
      this.mouseY = y;
      this.mouseButton = 0;
      this.sx = this.nx = this.mx = e.screenX | 0;
      this.sy = this.ny = this.my = e.screenY | 0;
      this.ttime = e.timeStamp;
      this.startedInViewport = this.insideViewportArea();
      this.startedInTabArea = this.insideTabArea();
    }
  }
  pointerLeave(e) {
    if (e.pointerType === "mouse") {
      this.idleTimer = performance.now();
      this.mouseX = -1;
      this.mouseY = -1;
      this.mouseClickX = -1;
      this.mouseClickY = -1;
      this.mouseClickButton = 0;
      this.mouseButton = 0;
    } else {
      this.idleTimer = performance.now();
      this.keyHeld[1] = 0;
      this.keyHeld[2] = 0;
      this.keyHeld[3] = 0;
      this.keyHeld[4] = 0;
    }
  }
  pointerMove(x, y, e) {
    if (e.pointerType === "mouse") {
      this.idleTimer = performance.now();
      this.mouseX = x;
      this.mouseY = y;
    } else {
      this.idleTimer = performance.now();
      this.mouseX = x;
      this.mouseY = y;
      this.nx = e.screenX | 0;
      this.ny = e.screenY | 0;
      if (this.dragging) {} else if (MobileKeyboard_default.isWithinCanvasKeyboard(x, y) && this.exceedsGrabThreshold(20)) {
        MobileKeyboard_default.notifyTouchMove(x, y);
      } else if (this.startedInViewport && !this.isViewportObscured() && this.exceedsGrabThreshold(20)) {
        this.panning = true;
        if (this.mx - this.nx > 0) {
          this.keyHeld[1] = 0;
          this.keyHeld[2] = 1;
        } else if (this.mx - this.nx < 0) {
          this.keyHeld[1] = 1;
          this.keyHeld[2] = 0;
        }
        if (this.my - this.ny > 0) {
          this.keyHeld[3] = 0;
          this.keyHeld[4] = 1;
        } else if (this.my - this.ny < 0) {
          this.keyHeld[3] = 1;
          this.keyHeld[4] = 0;
        }
      } else if (this.startedInTabArea || this.startedInChatScroll || this.isViewportObscured()) {
        if (!this.dragging && this.exceedsGrabThreshold(5)) {
          this.dragging = true;
          this.mouseClickX = x;
          this.mouseClickY = y;
          this.mouseClickButton = 1;
          this.mouseButton = 1;
        }
      }
      this.mx = this.nx;
      this.my = this.ny;
    }
  }
  touchStart(e) {
    if (e.touches.length < 2 || this.dragging) {
      e.preventDefault();
    }
  }
  exceedsGrabThreshold(size) {
    return Math.abs(this.sx - this.nx) > size || Math.abs(this.sy - this.ny) > size;
  }
  isViewportObscured() {
    return this.mainModalId !== -1;
  }
  insideMobileInputArea() {
    return this.insideChatInputArea() || this.insideChatPopupArea() || this.insideUsernameArea() || this.inPasswordArea() || this.insideReportInterfaceTextArea();
  }
  insideViewportArea() {
    const viewportAreaX1 = 4;
    const viewportAreaY1 = 4;
    const viewportAreaX2 = viewportAreaX1 + 512;
    const viewportAreaY2 = viewportAreaY1 + 334;
    return this.ingame && this.mouseX >= viewportAreaX1 && this.mouseX <= viewportAreaX2 && this.mouseY >= viewportAreaY1 && this.mouseY <= viewportAreaY2;
  }
  insideTabArea() {
    const tabAreaX1 = 553;
    const tabAreaY1 = 205;
    const tabAreaX2 = tabAreaX1 + 190;
    const tabAreaY2 = tabAreaY1 + 261;
    return this.ingame && this.mouseX >= tabAreaX1 && this.mouseX <= tabAreaX2 && this.mouseY >= tabAreaY1 && this.mouseY <= tabAreaY2;
  }
  insideChatScrollArea() {
    const chatInputAreaX1 = 480;
    const chatInputAreaY1 = 357;
    const chatInputAreaX2 = chatInputAreaX1 + 16;
    const chatInputAreaY2 = chatInputAreaY1 + 77;
    return this.ingame && !this.dialogInputOpen && !this.socialInputOpen && this.mouseX >= chatInputAreaX1 && this.mouseX <= chatInputAreaX2 && this.mouseY >= chatInputAreaY1 && this.mouseY <= chatInputAreaY2;
  }
  insideChatInputArea() {
    const chatInputAreaX1 = 17;
    const chatInputAreaY1 = 434;
    const chatInputAreaX2 = chatInputAreaX1 + 479;
    const chatInputAreaY2 = chatInputAreaY1 + 26;
    return this.ingame && this.chatComId === -1 && !this.dialogInputOpen && !this.socialInputOpen && this.mouseX >= chatInputAreaX1 && this.mouseX <= chatInputAreaX2 && this.mouseY >= chatInputAreaY1 && this.mouseY <= chatInputAreaY2;
  }
  insideChatPopupArea() {
    const chatInputAreaX1 = 17;
    const chatInputAreaY1 = 357;
    const chatInputAreaX2 = chatInputAreaX1 + 479;
    const chatInputAreaY2 = chatInputAreaY1 + 96;
    return this.ingame && (this.dialogInputOpen || this.socialInputOpen) && this.mouseX >= chatInputAreaX1 && this.mouseX <= chatInputAreaX2 && this.mouseY >= chatInputAreaY1 && this.mouseY <= chatInputAreaY2;
  }
  insideReportInterfaceTextArea() {
    if (!this.ingame) {
      return false;
    }
    if (this.mainModalId === -1 || this.reportAbuseComId === -1) {
      return false;
    }
    if (this.mainModalId !== this.reportAbuseComId) {
      return false;
    }
    const reportInputAreaX1 = 87;
    const reportInputAreaY1 = 119;
    const reportInputAreaX2 = reportInputAreaX1 + 348;
    const reportInputAreaY2 = reportInputAreaY1 + 37;
    return this.mouseX >= reportInputAreaX1 && this.mouseX <= reportInputAreaX2 && this.mouseY >= reportInputAreaY1 && this.mouseY <= reportInputAreaY2;
  }
  insideUsernameArea() {
    const usernameAreaX1 = 280;
    const usernameAreaY1 = 233;
    const usernameAreaX2 = usernameAreaX1 + 190;
    const usernameAreaY2 = usernameAreaY1 + 31;
    return !this.ingame && this.loginscreen === 2 && this.mouseX >= usernameAreaX1 && this.mouseX <= usernameAreaX2 && this.mouseY >= usernameAreaY1 && this.mouseY <= usernameAreaY2;
  }
  inPasswordArea() {
    const passwordAreaX1 = 280;
    const passwordAreaY1 = 264;
    const passwordAreaX2 = passwordAreaX1 + 278;
    const passwordAreaY2 = passwordAreaY1 + 20;
    return !this.ingame && this.loginscreen === 2 && this.mouseX >= passwordAreaX1 && this.mouseX <= passwordAreaX2 && this.mouseY >= passwordAreaY1 && this.mouseY <= passwordAreaY2;
  }
}
export {
  Client
};

//# debugId=87DDE3C8A84B092E64756E2164756E21
