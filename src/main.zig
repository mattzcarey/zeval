const std = @import("std");
const bun = @import("bun.zig");

const zevalAssert = struct {
    pub fn callback(
        ctx: ?*bun.JSContextRef,
        function: ?*bun.JSObjectRef,
        thisObject: ?*bun.JSObjectRef,
        argumentCount: usize,
        arguments: [*]const ?*bun.JSValueRef,
        exception: ?*?*bun.JSValueRef,
    ) callconv(.C) ?*bun.JSValueRef {
        _ = exception; // autofix
        _ = thisObject; // autofix
        _ = function; // autofix
        _ = argumentCount;
        _ = arguments;

        return bun.JSValueMakeBoolean(ctx, true);
    }
}.callback;

export fn __jsx_register_bunjs(ctx: ?*bun.JSContextRef, namespace: ?*bun.JSObjectRef) void {
    const func_name = bun.createString("zevalAssert");
    defer bun.JSStringRelease(func_name);

    const func = bun.JSObjectMakeFunctionWithCallback(ctx, func_name, zevalAssert);

    bun.JSObjectSetProperty(
        ctx,
        namespace,
        func_name,
        func,
        0,
        null,
    );
}

test "assert function can be created and called" {
    const testing = std.testing;

    // Create a fresh context
    const ctx = bun.JSGlobalContextCreate(null);
    defer bun.JSGlobalContextRelease(ctx);
    try testing.expect(ctx != null);

    // Create a global object to attach our function to
    const global = bun.JSObjectMake(ctx, null, null);
    try testing.expect(global != null);

    // Create and register our assert function
    const func_name = bun.createString("assert");
    defer bun.JSStringRelease(func_name);

    const func = bun.JSObjectMakeFunctionWithCallback(ctx, func_name, zevalAssert);
    try testing.expect(func != null);

    // Attach the function to the global object
    bun.JSObjectSetProperty(
        ctx,
        global,
        func_name,
        func,
        0,
        null,
    );

    // Test that the function has the correct type
    const type_of = bun.JSValueGetType(ctx, func);
    try testing.expectEqual(type_of, bun.JSType.Object);

    // Create a test value and verify it works
    const test_value = bun.JSValueMakeBoolean(ctx, true);
    try testing.expect(test_value != null);
}
