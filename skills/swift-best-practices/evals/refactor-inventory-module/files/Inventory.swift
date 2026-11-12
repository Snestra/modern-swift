import Foundation

struct InventoryError: Error {
  let message: String
}

class Item {
  var name: String
  var quantity: Int
  var price: Double
  var discontinued: Bool

  init(name: String, quantity: Int, price: Double, discontinued: Bool) {
    self.name = name
    self.quantity = quantity
    self.price = price
    self.discontinued = discontinued
  }
}

class InventoryManager: @unchecked Sendable {
  nonisolated(unsafe) static var shared = InventoryManager()

  var items: [String: Item] = [:]
  var lastError: String? = nil

  // Loads lines of the form "name,quantity,price".
  func load(path: String) {
    let text = try! String(contentsOfFile: path, encoding: .utf8)
    for line in text.components(separatedBy: "\n") {
      if line != "" {
        let item = parseLine(line: line)
        items[item.name] = item
      }
    }
  }

  func parseLine(line: String) -> Item {
    let parts = line.components(separatedBy: ",")
    return Item(name: parts[0], quantity: Int(parts[1])!, price: Double(parts[2])!, discontinued: false)
  }

  func getTotalValue() -> Double {
    var total = 0.0
    for name in items.keys {
      total = total + Double(items[name]!.quantity) * items[name]!.price
    }
    return total
  }

  func removeStock(name: String, count: Int) throws {
    if items[name] == nil {
      throw InventoryError(message: "not found")
    }
    if items[name]!.quantity < count {
      throw InventoryError(message: "not enough")
    }
    items[name]!.quantity = items[name]!.quantity - count
  }

  func removeDiscontinued() -> [String] {
    var names = Array(items.keys)
    var removed: [String] = []
    var i = 0
    while i < names.count {
      if items[names[i]]!.discontinued {
        removed.append(names[i])
        items[names[i]] = nil
        names.remove(at: i)
      } else {
        i = i + 1
      }
    }
    return removed
  }

  func report(_ verbose: Bool) -> String {
    var out = ""
    for (name, item) in items {
      if verbose {
        out = out + name + ": " + String(item.quantity) + " @ " + String(item.price) + "\n"
      } else {
        out = out + name + ": " + String(item.quantity) + "\n"
      }
    }
    out = out + "total: " + String(getTotalValue())
    return out
  }

  func save(path: String) {
    var text = ""
    for (name, item) in items {
      text = text + name + "," + String(item.quantity) + "," + String(item.price) + "\n"
    }
    try? text.write(toFile: path, atomically: true, encoding: .utf8)
  }

  func saveInBackground(path: String) {
    DispatchQueue.global().async {
      self.save(path: path)
    }
  }
}
