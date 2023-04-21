const colors = require('./colors')
module.exports = {
  plugins: {
    'postcss-simple-vars': {
      variables: colors
    },
    autoprefixer: {}
  },
}
