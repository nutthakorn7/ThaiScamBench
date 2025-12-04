"""
Test runner script

Run all tests with coverage reporting.
"""
import subprocess
import sys


def run_unit_tests():
    """Run unit tests with coverage"""
    print("="*70)
    print("RUNNING UNIT TESTS")
    print("="*70)
    
    result = subprocess.run([
        "pytest",
        "tests/unit/",
        "-v",
        "--cov=app",
        "--cov-report=term-missing",
        "--cov-report=html"
    ], cwd=".")
    
    return result.returncode


def run_integration_tests():
    """Run integration tests"""
    print("\n" + "="*70)
    print("RUNNING INTEGRATION TESTS")
    print("="*70)
    
    result = subprocess.run([
        "pytest",
        "tests/integration/",
        "-v"
    ], cwd=".")
    
    return result.returncode


def main():
    """Run all tests"""
    print("🧪 ThaiScamBench Test Suite\n")
    
    # Run unit tests
    unit_result = run_unit_tests()
    
    # Run integration tests
    integration_result = run_integration_tests()
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    if unit_result == 0 and integration_result == 0:
        print("✅ All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        print(f"   Unit tests: {'✅ PASS' if unit_result == 0 else '❌ FAIL'}")
        print(f"   Integration tests: {'✅ PASS' if integration_result == 0 else '❌ FAIL'}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
