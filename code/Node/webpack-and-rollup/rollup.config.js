import { terser } from "rollup-plugin-terser"

export default {
  input: 'index.js',
  plugins: [terser()],
  output: {
    name: 'demo',
    file: 'dist/rollup.umd.js',
    format: 'umd'
  }
}