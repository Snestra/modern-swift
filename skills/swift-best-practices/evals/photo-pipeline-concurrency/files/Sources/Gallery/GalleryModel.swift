import Foundation
import Observation

/// One imported photo, ready to show in the grid.
struct Thumbnail: Identifiable, Equatable {
  let id: Int
  let pixels: [UInt8]
  let averageColor: UInt8
}

/// The state behind the gallery screen. The app's views read `thumbnails` and `isImporting`.
@Observable
final class GalleryModel {
  private(set) var thumbnails: [Thumbnail] = []
  private(set) var isImporting = false

  /// Imports photos and appends one thumbnail per photo, in the order given.
  func importPhotos(_ photos: [Data]) {
    isImporting = true
    for photo in photos {
      let scaler = Scaler()
      let pixels = scaler.downscale(photo)
      let color = scaler.averageColor(of: pixels)
      thumbnails.append(Thumbnail(id: thumbnails.count, pixels: pixels, averageColor: color))
    }
    isImporting = false
  }
}

/// Downscales image data. Each call takes about 40 ms for a full size photo.
final class Scaler {
  private var scratch: [UInt8] = []

  func downscale(_ photo: Data) -> [UInt8] {
    scratch.removeAll(keepingCapacity: true)
    var index = photo.startIndex
    while index < photo.endIndex {
      scratch.append(photo[index])
      index += 16
    }
    return scratch
  }

  func averageColor(of pixels: [UInt8]) -> UInt8 {
    guard !pixels.isEmpty else { return 0 }
    return UInt8(pixels.reduce(0) { $0 + Int($1) } / pixels.count)
  }
}
