import React
import UIKit
import PiggyKit

class MainViewController: UIViewController {
  override var preferredStatusBarStyle: UIStatusBarStyle {
    if #available(iOS 13.0, *) { return .lightContent } else { return .default }
  }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, RCTBridgeDelegate {
  var window: UIWindow?

  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    let bridge = RCTBridge(delegate: self, launchOptions: launchOptions)
    let rootView = RCTRootView(bridge: bridge!, moduleName: "PiggyDemo", initialProperties: nil)
    rootView.backgroundColor = UIColor(red: 0.114, green: 0.125, blue: 0.129, alpha: 1.0)
    window = UIWindow(frame: UIScreen.main.bounds)
    let rootViewController = MainViewController()
    rootViewController.view = rootView
    window?.rootViewController = rootViewController;
    window?.makeKeyAndVisible()
    Piggy.instance.setBuildType(.Debug)
    Piggy.instance.enableTcpForwarding()
    return true
  }

  @objc func sourceURL(for bridge: RCTBridge!) -> URL? {
    return Piggy.instance.getBundleUrl(for: bridge)
  }
}
