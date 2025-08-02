//
//  CommishApp.swift
//  Commish
//
//  Created by Howie Hill on 2/8/2025.
//

import SwiftUI
import FirebaseCore
import FirebaseMessaging

@main
struct CommishApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            PhoneCallView()
        }
    }
}
