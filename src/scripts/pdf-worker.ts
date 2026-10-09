// pdf.js worker entry: install the stream polyfill before the worker code runs.
import './stream-polyfill';
import 'pdfjs-dist/legacy/build/pdf.worker.min.mjs';
