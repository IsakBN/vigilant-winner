/**
 * Artifact Path Builder
 *
 * Custom path builder for Detox artifacts.
 */

class ArtifactPathBuilder {
  constructor({ rootDir }) {
    this.rootDir = rootDir
  }

  buildPathForTestArtifact(artifactName, testSummary) {
    const { title, fullName, status } = testSummary
    const sanitizedName = this.sanitize(fullName || title)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    if (status === 'failed') {
      return `${this.rootDir}/failed/${sanitizedName}/${timestamp}/${artifactName}`
    }

    return `${this.rootDir}/passed/${sanitizedName}/${timestamp}/${artifactName}`
  }

  sanitize(name) {
    return name
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 100)
  }
}

module.exports = ArtifactPathBuilder
