pub const JSValueRef = *opaque {};
pub const JSObjectRef = JSValueRef;
pub const JSContextRef = *opaque {};
pub const JSStringRef = *opaque {};
pub const JSGlobalContextRef = JSContextRef;

pub extern "c" fn JSValueMakeBoolean(ctx: ?*JSContextRef, value: bool) ?*JSValueRef;
pub extern "c" fn JSValueToBoolean(ctx: ?*JSContextRef, value: ?*JSValueRef) bool;
pub extern "c" fn JSValueGetType(ctx: ?*JSContextRef, value: ?*JSValueRef) JSType;

pub extern "c" fn JSStringCreateWithUTF8CString(str: [*:0]const u8) ?*JSStringRef;
pub extern "c" fn JSStringRelease(str: ?*JSStringRef) void;

pub extern "c" fn JSObjectSetProperty(
    ctx: ?*JSContextRef,
    object: ?*JSObjectRef,
    propertyName: ?*JSStringRef,
    value: ?*JSValueRef,
    attributes: c_uint,
    exception: ?*?*JSValueRef,
) void;

pub extern "c" fn JSObjectMakeFunctionWithCallback(
    ctx: ?*JSContextRef,
    name: ?*JSStringRef,
    callback: JSObjectCallAsFunctionCallback,
) ?*JSValueRef;

pub const JSObjectCallAsFunctionCallback = *const fn (
    ctx: ?*JSContextRef,
    function: ?*JSObjectRef,
    thisObject: ?*JSObjectRef,
    argumentCount: usize,
    arguments: [*]const ?*JSValueRef,
    exception: ?*?*JSValueRef,
) callconv(.C) ?*JSValueRef;

pub const JSType = enum(u32) {
    Undefined = 0,
    Null = 1,
    Boolean = 2,
    Number = 3,
    String = 4,
    Object = 5,
    Symbol = 6,
};

pub fn createString(str: []const u8) ?*JSStringRef {
    return JSStringCreateWithUTF8CString(@ptrCast(str.ptr));
}

pub extern "c" fn JSGlobalContextCreate(globalObject: ?*JSObjectRef) ?*JSGlobalContextRef;
pub extern "c" fn JSGlobalContextRelease(ctx: ?*JSGlobalContextRef) void;
pub extern "c" fn JSObjectMake(ctx: ?*JSContextRef, jsClass: ?*anyopaque, data: ?*anyopaque) ?*JSObjectRef;
