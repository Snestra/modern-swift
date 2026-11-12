import Combine
import Foundation
import SwiftUI

struct Post: Identifiable, Decodable, Sendable {
  let id: Int
  let title: String
  let imageAddress: String
}

actor ImageCache {
  private var images: [String: Data] = [:]

  func image(at address: String) async throws -> Data {
    if let cached = images[address] {
      return cached
    }
    let url = URL(string: address)!
    let (data, _) = try await URLSession.shared.data(from: url)
    images[address] = data
    return data
  }
}

final class LegacyAPI: Sendable {
  func fetchPosts(completion: @escaping @Sendable (Data?, (any Error)?) -> Void) {
    let url = URL(string: "https://example.com/posts.json")!
    URLSession.shared.dataTask(with: url) { data, _, error in
      completion(data, error)
    }.resume()
  }
}

final class FeedViewModel: ObservableObject, @unchecked Sendable {
  @Published var posts: [Post] = []
  @Published var isLoading = false
  @Published var errorText: String?

  let api = LegacyAPI()
  let cache = ImageCache()
  var onReload: (() -> Void)?

  init() {
    onReload = {
      self.load()
    }
  }

  func fetch() async -> [Post] {
    await withCheckedContinuation { continuation in
      api.fetchPosts { data, error in
        if let data {
          let posts = try! JSONDecoder().decode([Post].self, from: data)
          continuation.resume(returning: posts)
        }
      }
    }
  }

  func load() {
    isLoading = true
    Task.detached {
      let posts = await self.fetch()
      DispatchQueue.main.async {
        self.posts = posts
        self.isLoading = false
      }
    }
  }
}

struct FeedView: View {
  @StateObject private var model = FeedViewModel()
  @State private var selection: Post.ID?

  var body: some View {
    List(model.posts, selection: $selection) { post in
      PostRow(post: post, cache: model.cache)
    }
    .overlay {
      if model.isLoading { ProgressView() }
    }
    .onAppear {
      model.load()
    }
  }
}

struct PostRow: View {
  let post: Post
  let cache: ImageCache
  @State private var imageData: Data?

  var body: some View {
    HStack {
      if let imageData, let image = NSImage(data: imageData) {
        Image(nsImage: image).resizable().frame(width: 44, height: 44)
      }
      Text(post.title)
    }
    .onAppear {
      Task {
        imageData = try? await cache.image(at: post.imageAddress)
      }
    }
  }
}
