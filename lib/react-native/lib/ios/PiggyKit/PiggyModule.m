#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(PiggyModule, PiggyModule, NSObject)

RCT_EXTERN_METHOD(create:(NSString *)stopwatch
                  options:(NSDictionary *)options)

RCT_EXTERN_METHOD(start:(NSString *)stopwatch
                  workName:(NSString *)workName
                  workId:(NSString *)workId
                  priority:(double)priority)

RCT_EXTERN_METHOD(stop:(NSString *)stopwatch
                  workId:(NSString *)workId
                  context:(NSDictionary *)context)

RCT_EXTERN_METHOD(checkpoint:(NSString *)stopwatch
                  workId:(NSString *)workId
                  name:(NSString *)name)

RCT_EXTERN_METHOD(record:(NSString*)stopwatch
                  workName:(NSString *)workName
                  workId:(NSString *)workId
                  start:(double)start
                  end:(double)end
                  priority:(double)priority
                  context:(NSDictionary *)context)

RCT_EXTERN_METHOD(report)

RCT_EXTERN_METHOD(onStarted)

RCT_EXTERN_METHOD(getConfiguration:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setConfiguration:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(logEvent:(NSDictionary *)event)

RCT_EXTERN_METHOD(getCookies:(NSString *)url
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
