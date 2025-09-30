import { File } from "./file";
import { Region } from "../util/region";

export class TokenizedFile extends File {

  constructor(
    public file: File,
    public readonly tokens: Array<string>,
    public readonly mapping: Array<Region>
  ) {
    super(file.path, file.content, file.extra, file.id);
  }

}