/* eslint-disable no-dupe-class-members */
/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import net from "net";
import { Readable } from "stream";
import { getLogger } from "@fonoster/logger";
import { AudioSocketError } from "./AudioSocketError";
import { AudioStream } from "./AudioStream";
import { nextMessage } from "./nextMessage";
import { EventType, MessageType, StreamRequest } from "./types";

const logger = getLogger({ service: "streams", filePath: __filename });

class AudioSocket {
  private server: net.Server;
  private connectionHandler:
    | ((req: StreamRequest, stream: AudioStream) => void)
    | null = null;

  constructor() {
    this.server = net.createServer((socket) => {
      logger.info("client connected");

      const asStream = new Readable();
      const audioStream = new AudioStream(asStream, socket);

      socket.on(EventType.DATA, async (data) => {
        const stream = new Readable();
        stream.push(data);
        stream.push(null); // End of the stream

        try {
          const message = await nextMessage(stream);

          switch (message.getKind()) {
            case MessageType.ID:
              if (this.connectionHandler) {
                this.connectionHandler({ ref: message.getId() }, audioStream);
              }
              break;
            case MessageType.SLIN:
            case MessageType.SILENCE:
              asStream.emit(EventType.DATA, message.getPayload());
              break;
            case MessageType.HANGUP:
              asStream.emit(EventType.END);
              break;
            case MessageType.ERROR:
              asStream.emit(
                EventType.ERROR,
                new AudioSocketError(message.getErrorCode())
              );
              break;
            default:
              break;
          }
        } catch (err) {
          logger.error("error processing message:", err);
        }
      });

      socket.on(EventType.END, () => asStream.emit(EventType.END));

      socket.on(EventType.ERROR, (err) => {
        logger.error("socket error:", err);
        asStream.emit(EventType.ERROR, err);
      });
    });
  }

  // Overload signatures
  listen(port: number, callback?: () => void): void;
  listen(port: number, bind: string, callback?: () => void): void;

  listen(
    port: number,
    bindOrCallback?: string | (() => void),
    callback?: () => void
  ) {
    if (typeof bindOrCallback === "string") {
      this.server.listen(port, bindOrCallback, callback);
    } else {
      // Default to "0.0.0.0" if no bind address is provided
      this.server.listen(port, "0.0.0.0", bindOrCallback);
    }
  }
  onConnection(handler: (req: StreamRequest, stream: AudioStream) => void) {
    this.connectionHandler = handler;
  }
}

export { AudioSocket };
