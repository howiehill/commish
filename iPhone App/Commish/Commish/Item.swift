//
//  Item.swift
//  Commish
//
//  Created by Howie Hill on 2/8/2025.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
