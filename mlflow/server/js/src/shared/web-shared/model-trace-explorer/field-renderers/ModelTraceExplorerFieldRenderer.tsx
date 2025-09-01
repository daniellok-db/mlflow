import { every, isString } from 'lodash';
import { useMemo } from 'react';

import { ModelTraceExplorerChatToolsRenderer } from './ModelTraceExplorerChatToolsRenderer';
import { ModelTraceExplorerRetrieverFieldRenderer } from './ModelTraceExplorerRetrieverFieldRenderer';
import { ModelTraceExplorerTextFieldRenderer } from './ModelTraceExplorerTextFieldRenderer';
import { CodeSnippetRenderMode } from '../ModelTrace.types';
import { isModelTraceChatTool, isRetrieverDocument, normalizeConversation } from '../ModelTraceExplorer.utils';
import { ModelTraceExplorerCodeSnippet } from '../ModelTraceExplorerCodeSnippet';
import { ModelTraceExplorerConversation } from '../right-pane/ModelTraceExplorerConversation';

function pcmToWav(base64PCM, sampleRate = 44100, numChannels = 1, bitDepth = 16) {
  // Decode base64 to binary data
  const binaryString = atob(base64PCM);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const pcmData = new Int16Array(bytes.buffer);
  const wavBuffer = createWavHeader(pcmData, sampleRate, numChannels, bitDepth);

  // Create blob and object URL
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function createWavHeader(pcmData, sampleRate, numChannels, bitDepth) {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = pcmData.length * 2; // 16-bit = 2 bytes per sample
  const fileSize = 36 + dataSize;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // WAV header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, fileSize, true); // File size
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Format chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true); // Number of channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, byteRate, true); // Byte rate
  view.setUint16(32, blockAlign, true); // Block align
  view.setUint16(34, bitDepth, true); // Bits per sample
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // Data size

  // Combine header and PCM data
  const wavBuffer = new ArrayBuffer(header.byteLength + pcmData.byteLength);
  new Uint8Array(wavBuffer).set(new Uint8Array(header), 0);
  new Uint8Array(wavBuffer).set(new Uint8Array(pcmData.buffer), header.byteLength);

  return wavBuffer;
}

export const ModelTraceExplorerFieldRenderer = ({
  title,
  data,
  renderMode,
}: {
  title: string;
  data: string;
  renderMode: 'default' | 'json' | 'text';
}) => {
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }, [data]);

  const dataIsString = isString(parsedData);

  if (dataIsString) {
    // Usage
    const base64PCM = parsedData;
    const audioUrl = pcmToWav(base64PCM, 24000, 1, 16);
    return (
      <audio controls src={audioUrl}>
        <track kind="captions" />
      </audio>
    );
  }

  const chatMessages = normalizeConversation(parsedData);
  const isChatTools = Array.isArray(parsedData) && parsedData.length > 0 && every(parsedData, isModelTraceChatTool);
  const isRetrieverDocuments =
    Array.isArray(parsedData) && parsedData.length > 0 && every(parsedData, isRetrieverDocument);

  if (renderMode === 'json') {
    return <ModelTraceExplorerCodeSnippet title={title} data={data} initialRenderMode={CodeSnippetRenderMode.JSON} />;
  }

  if (renderMode === 'text') {
    return <ModelTraceExplorerCodeSnippet title={title} data={data} initialRenderMode={CodeSnippetRenderMode.TEXT} />;
  }

  if (dataIsString) {
    return <ModelTraceExplorerTextFieldRenderer title={title} value={parsedData} />;
  }

  if (chatMessages && chatMessages.length > 0) {
    return <ModelTraceExplorerConversation messages={chatMessages} />;
  }

  if (isChatTools) {
    return <ModelTraceExplorerChatToolsRenderer title={title} tools={parsedData} />;
  }

  if (isRetrieverDocuments) {
    return <ModelTraceExplorerRetrieverFieldRenderer title={title} documents={parsedData} />;
  }

  return <ModelTraceExplorerCodeSnippet title={title} data={data} />;
};
