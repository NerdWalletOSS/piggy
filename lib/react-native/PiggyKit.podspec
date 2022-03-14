require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.version      = package['version'] 
  s.module_name  = 'PiggyKit'
  s.name         = 'PiggyKit'
  s.summary      = package['summary']
  s.description  = package['description']
  s.license      = package['license']
  s.authors      = package['author']
  s.homepage     = package['homepage']
  s.frameworks   = 'UIKit'
  s.platform     = :ios, "11.0"
  s.source       = { :git => 'https://github.com/NerdWalletOSS/piggy.git', :tag => "v#{s.version}" }
  s.source_files = "lib/ios/PiggyKit/**/*.{h,m,swift}"
  s.dependency   'React-Core'
  s.dependency   'Starscream'
  s.dependency   'CocoaAsyncSocket'
  s.dependency   'Flipper-PeerTalk'
end
