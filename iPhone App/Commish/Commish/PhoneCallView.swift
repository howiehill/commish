//
//  PhoneCallView.swift
//  Commish
//
//  Created by Howie Hill on 2/8/2025.
//

import SwiftUI

struct PhoneCallView: View {
    @State private var phoneNumber: String = ""

    var body: some View {
        VStack(spacing: 20) {
            Text("Enter a phone number:")
                .font(.headline)

            TextField("e.g. 0412345678", text: $phoneNumber)
                .keyboardType(.phonePad)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()

            Button(action: {
                initiateCall(phoneNumber: phoneNumber)
            }) {
                Text("Call Now")
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.blue)
                    .cornerRadius(10)
            }
            .padding(.horizontal)
        }
        .padding()
    }

    func initiateCall(phoneNumber: String) {
        if let url = URL(string: "tel://\(phoneNumber)"),
           UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        }
    }
}

struct PhoneCallView_Previews: PreviewProvider {
    static var previews: some View {
        PhoneCallView()
    }
}
