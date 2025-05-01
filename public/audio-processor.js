class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.bufferSize = options.processorOptions.bufferSize;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const inputChannel = input[0];
      
      // Fill the buffer
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex = (this.bufferIndex + 1) % this.bufferSize;
      }

      // Calculate RMS
      let sum = 0;
      for (let i = 0; i < this.bufferSize; i++) {
        sum += this.buffer[i] * this.buffer[i];
      }
      const rms = Math.sqrt(sum / this.bufferSize);

      // Calculate ZCR
      let zcr = 0;
      for (let i = 1; i < this.bufferSize; i++) {
        if ((this.buffer[i] > 0 && this.buffer[i-1] < 0) || 
            (this.buffer[i] < 0 && this.buffer[i-1] > 0)) {
          zcr++;
        }
      }
      zcr = zcr / this.bufferSize;

      // Calculate chroma (simplified)
      const chroma = new Array(12).fill(0);
      for (let i = 0; i < this.bufferSize; i++) {
        const bin = Math.floor(Math.abs(this.buffer[i]) * 12) % 12;
        chroma[bin]++;
      }

      // Normalize chroma
      const maxChroma = Math.max(...chroma);
      if (maxChroma > 0) {
        for (let i = 0; i < chroma.length; i++) {
          chroma[i] = chroma[i] / maxChroma;
        }
      }

      // Send the results back to the main thread
      this.port.postMessage({
        rms,
        zcr,
        chroma
      });
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor); 