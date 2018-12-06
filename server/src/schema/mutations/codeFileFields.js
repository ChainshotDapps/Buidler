const { findCodeFilePaths } = require('../../projectHelpers');
const { CodeFileType } = require('../models');
const { configWriter, fileWriter, configResolver, fileRemove } = require('../../utils/ioHelpers');
const { LOOKUP_KEY, MODEL_DB } = require('../../config');
const {
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
} = require('graphql');

const cfProjectPropNames = {
  initialCode: true
}

const codeFileMutationArgs = {
  id: { type: GraphQLString },
  name: { type: GraphQLString },
  executable: { type: GraphQLBoolean },
  executablePath: { type: GraphQLString },
  fileLocation: { type: GraphQLString },
  hasProgress: { type: GraphQLBoolean },
  mode: { type: GraphQLString },
  readOnly: { type: GraphQLBoolean },
  testFixture: { type: GraphQLBoolean },
  visible: { type: GraphQLBoolean },
  codeStageIds: { type: new GraphQLList(GraphQLString) },
  initialCode: { type: GraphQLString },
}

module.exports = {
  createCodeFile: {
    type: CodeFileType,
    args: codeFileMutationArgs,
    async resolve (_, props) {
      const keys = Object.keys(props);
      for(let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if(codeFileProjectProps[key]) {
          const paths = await findCodeFilePaths(codeFile);
          await Promise.all(paths.map(async (path) => {
            return await fileWriter(path, props[key]);
          }));
          props[key] = LOOKUP_KEY;
        }
      }
      return configWriter(MODEL_DB.CODE_FILES, props);
    }
  },
  modifyCodeFile: {
    type: CodeFileType,
    args: codeFileMutationArgs,
    async resolve (_, props) {
      const codeFile = await configResolver(MODEL_DB.CODE_FILES, props.id);
      const merged = { ...codeFile, ...props };

      const keys = Object.keys(props);
      for(let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if(codeFileProjectProps[key]) {
          // remove the previous path (TODO: check and only do if not in new paths)
          const previousPaths = await findCodeFilePaths(codeFile);
          await Promise.all(previousPaths.map(async (basePath) => {
            return await fileRemove(path);
          }));
          // add the new path
          const paths = await findCodeFilePaths(merged);
          await Promise.all(paths.map(async (path) => {
            return await fileWriter(path, merged[key]);
          }));
          merged[key] = LOOKUP_KEY;
        }
      }

      return configWriter(MODEL_DB.CODE_FILES, merged);
    }
  }
}