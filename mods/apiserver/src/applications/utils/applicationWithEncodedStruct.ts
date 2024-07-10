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
import { Application } from "@fonoster/common";
import { struct } from "pb-util";

function applicationWithEncodedStruct(application): Application {
  const encodeConfig = (property) => {
    return property?.config ? struct.encode(property.config) : null;
  };

  const result = { ...application };

  if (application.textToSpeech) {
    result.textToSpeech = {
      ...application.textToSpeech,
      config: encodeConfig(application.textToSpeech)
    };
  }

  if (application.speechToText) {
    result.speechToText = {
      ...application.speechToText,
      config: encodeConfig(application.speechToText)
    };
  }

  if (application.intelligence) {
    const intelligenceCopy = application.intelligence;
    delete intelligenceCopy.credentials;

    result.intelligence = {
      ...intelligenceCopy,
      config: encodeConfig(intelligenceCopy)
    };
  }

  return result; // Return the modified object
}

export { applicationWithEncodedStruct };
