//
//  main.swift
//  forwarder
//
//  Created by Casey Langen on 5/24/19.
//  Copyright © 2019 NerdWallet. All rights reserved.
//

import Foundation

setbuf(__stdoutp, nil);

var clients = Array<FBPortForwardingClient>()
var ports = Dictionary<UInt,UInt>()

CommandLine.arguments.forEach({ arg in
    if arg.starts(with: "--ports=") {
        let parts = arg.split(separator: "=")
        if parts.count > 1 {
            let separated = parts[1].split(separator: ",")
            separated.forEach({ rawPorts in
                let portList = rawPorts.split(separator: ":")
                if portList.count == 2 {
                    let original = UInt(portList[0])
                    let virtual = UInt(portList[1])
                    if let o = original, let v = virtual {
                        ports[o] = v
                    }
                }
            })
        }
    }
})

if ports.count == 0 {
    print("no ports specified, defaulting to '--ports=8081:9091,8347:9347'")
    ports = [
        UInt(8081): UInt(9081),
        UInt(8347): UInt(9347)
    ]
}

ports.forEach({ originalPort, virtualPort in
    let client = FBPortForwardingClient()
    if let c = client {
        print("forwarding port \(originalPort):\(virtualPort)...")
        c.forwardConnections(toPort: originalPort)
        c.connectToMultiplexingChannel(onPort: virtualPort)
        clients.append(c)
    }
})

print("running event loop...")

RunLoop.current.run()
